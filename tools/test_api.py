"""API smoke tests without a real OpenAI key (fake client). Run from repo root: python tools/test_api.py"""
import os, sys, tempfile, types
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.pop("DATABASE_URL", None); os.environ.pop("POSTGRES_URL", None)
os.environ["USAGE_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "u.db")
os.environ["OPENAI_API_KEY"] = "sk-test-not-real"
os.environ["ADMIN_PASSWORD"] = "pw"
os.environ["ABLY_API_KEY"] = "appid.keyid:secretsecret"
os.environ["AI_DAILY_LIMIT_PER_STUDENT"] = "3"
import httpx, openai
from fastapi.testclient import TestClient
from api import index as main

client = TestClient(main.app)
student = {"id": "stu-1", "name": "Alex"}

class FakeCompletions:
    mode = "ok"
    def create(self, **kw):
        req = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
        if self.mode == "quota":
            resp = httpx.Response(429, request=req, json={"error": {"code": "insufficient_quota", "message": "You exceeded your current quota"}})
            raise openai.RateLimitError("You exceeded your current quota, please check your plan and billing details.", response=resp, body={"code": "insufficient_quota", "message": "You exceeded your current quota"})
        if self.mode == "rate":
            resp = httpx.Response(429, request=req, json={"error": {"code": "rate_limit_exceeded"}})
            raise openai.RateLimitError("Rate limit reached for requests", response=resp, body={"code": "rate_limit_exceeded", "message": "Rate limit reached"})
        assert kw["messages"][0]["role"] == "system"
        return types.SimpleNamespace(model="gpt-test", usage=types.SimpleNamespace(prompt_tokens=100, completion_tokens=50),
                                     choices=[types.SimpleNamespace(message=types.SimpleNamespace(content="Look at line 3: r <= m.length"))])

fake = FakeCompletions()
main._client = types.SimpleNamespace(chat=types.SimpleNamespace(completions=fake))

def test_all():
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "Why do I get out of bounds?"}]})
    assert r.status_code == 200 and "line 3" in r.json()["reply"], r.text
    r = client.post("/api/ai/debug", json={"student": student, "ticket": {"id": "PF-102", "title": "t", "task": "x"},
                                            "files": [{"path": "Grid.java", "content": "class Grid {}"}],
                                            "result": {"status": "compile_error", "stderr": "error"}})
    assert r.status_code == 200, r.text
    fake.mode = "quota"
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 429 and r.json()["error_code"] == "quota_exhausted" and "contact your teacher" in r.json()["message"], r.text
    fake.mode = "rate"
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "hi"}]})
    assert r.json()["error_code"] == "rate_limited", r.text
    fake.mode = "ok"
    client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "hi"}]})
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "hi"}]})
    assert r.json()["error_code"] == "daily_limit", r.text
    assert client.get("/api/admin/usage").status_code == 401
    r = client.get("/api/admin/usage", headers={"X-Admin-Password": "pw"})
    d = r.json()
    assert d["month"]["requests"] == 3 and d["month"]["prompt_tokens"] == 300, d["month"]
    assert d["by_student"][0]["name"] == "Alex" and d["last_quota_exhausted"], d
    print("ALL OK", d["month"], d["failures"])

def test_accounts():
    assert client.post("/api/auth/login", json={"username": "stu", "password": "wrong"}).status_code == 401
    stu = client.post("/api/auth/login", json={"username": "STU", "password": "stu"}).json()["token"]
    test = client.post("/api/auth/login", json={"username": "test", "password": "test"}).json()["token"]
    hs, ht = {"Authorization": f"Bearer {stu}"}, {"Authorization": f"Bearer {test}"}
    assert client.get("/api/progress").status_code == 401
    assert client.get("/api/progress", headers={"Authorization": "Bearer x.y"}).status_code == 401
    p = client.get("/api/progress", headers=hs).json()
    assert p["rev"] == 0 and p["data"] == {"tickets": {}}, p
    data = {"tickets": {"a/PF-101": {"status": "merged"}}}
    r = client.put("/api/progress", headers=hs, json={"data": data, "base_rev": 0}).json()
    assert r == {"conflict": False, "rev": 1, "updated_at": r["updated_at"]}, r
    r = client.put("/api/progress", headers=hs, json={"data": {"tickets": {}}, "base_rev": 0}).json()
    assert r["conflict"] and r["data"] == data and r["rev"] == 1, r  # stale write refused
    h = {"X-Admin-Password": "pw"}
    assert client.post("/api/admin/accounts/sync", json={"source": "stu", "target": "test"}).status_code == 401
    r = client.post("/api/admin/accounts/sync", headers=h, json={"source": "stu", "target": "test"})
    assert r.status_code == 200, r.text
    assert client.get("/api/progress", headers=ht).json()["data"] == data
    accs = {a["username"]: a for a in client.get("/api/admin/accounts", headers=h).json()["accounts"]}
    assert accs["test"]["merged"] == 1 and accs["stu"]["merged"] == 1, accs
    r = client.post("/api/admin/accounts/test/reset", headers=h)
    assert r.status_code == 200
    t = client.get("/api/progress", headers=ht).json()
    assert t["data"] == {"tickets": {}} and t["rev"] == 2, t
    assert client.get("/api/progress", headers=hs).json()["data"] == data  # stu untouched
    assert client.post("/api/admin/accounts/nobody/reset", headers=h).status_code == 404
    print("ACCOUNTS OK")

def test_time_and_stars():
    stu = client.post("/api/auth/login", json={"username": "stu", "password": "stu"}).json()["token"]
    test = client.post("/api/auth/login", json={"username": "test", "password": "test"}).json()["token"]
    hs, ht, h = {"Authorization": f"Bearer {stu}"}, {"Authorization": f"Bearer {test}"}, {"X-Admin-Password": "pw"}
    assert client.post("/api/time", json={"ticket": "s1/PF-101", "ms": 1000}).status_code == 401
    assert client.post("/api/time", headers=hs, json={"ticket": "bad key", "ms": 1000}).status_code == 422
    assert client.post("/api/time", headers=hs, json={"ticket": "s1/PF-101", "ms": 10**9}).status_code == 422
    for ms in (30000, 12000):
        assert client.post("/api/time", headers=hs, json={"ticket": "s1/PF-101", "ms": ms}).status_code == 200
    client.post("/api/time", headers=ht, json={"ticket": "s1/PF-102", "ms": 5000})
    assert client.get("/api/admin/time").status_code == 401
    rows = {(r["username"], r["ticket"]): r["active_ms"] for r in client.get("/api/admin/time", headers=h).json()["time"]}
    assert rows == {("stu", "s1/PF-101"): 42000, ("test", "s1/PF-102"): 5000}, rows
    rev = client.get("/api/progress", headers=hs).json()["rev"]
    client.put("/api/progress", headers=hs, json={"data": {"tickets": {"s1/PF-103": {"status": "todo", "starred": True}}}, "base_rev": rev})
    client.post("/api/admin/accounts/sync", headers=h, json={"source": "stu", "target": "test"})
    rows = {(r["username"], r["ticket"]): r["active_ms"] for r in client.get("/api/admin/time", headers=h).json()["time"]}
    assert rows == {("stu", "s1/PF-101"): 42000, ("test", "s1/PF-101"): 42000}, rows
    accs = {a["username"]: a for a in client.get("/api/admin/accounts", headers=h).json()["accounts"]}
    assert accs["test"]["starred"] == ["s1/PF-103"] == accs["stu"]["starred"], accs
    client.post("/api/admin/accounts/test/reset", headers=h)
    rows = {(r["username"], r["ticket"]) for r in client.get("/api/admin/time", headers=h).json()["time"]}
    assert rows == {("stu", "s1/PF-101")}, rows
    print("TIME + STARS OK")


def test_notes():
    h = {"X-Admin-Password": "pw"}
    assert client.get("/api/admin/notes").status_code == 401
    d = client.get("/api/admin/accounts/stu", headers=h).json()
    assert d["username"] == "stu" and "files" not in d["tickets"].get("a/PF-101", {}), d
    assert client.get("/api/admin/accounts/nobody", headers=h).status_code == 404
    r = client.post("/api/admin/notes", headers=h, json={"username": "STU", "body": " Off-by-one on rows ", "tickets": ["a/PF-101", "a/PF-101", "a/PF-102"]})
    assert r.status_code == 200, r.text
    n1 = r.json()
    assert n1["username"] == "stu" and n1["body"] == "Off-by-one on rows" and n1["tickets"] == ["a/PF-101", "a/PF-102"] and not n1["done"], n1
    general = client.post("/api/admin/notes", headers=h, json={"body": "Next class: start with PF-203"}).json()
    assert general["username"] is None and general["tickets"] == [], general
    assert client.post("/api/admin/notes", headers=h, json={"username": "nobody", "body": "x"}).status_code == 400
    assert client.post("/api/admin/notes", headers=h, json={"body": "   "}).status_code == 400
    assert len(client.get("/api/admin/notes", headers=h).json()["notes"]) == 2
    assert [n["id"] for n in client.get("/api/admin/notes?username=stu", headers=h).json()["notes"]] == [n1["id"]]
    r = client.put(f"/api/admin/notes/{n1['id']}", headers=h, json={"done": True}).json()
    assert r["done"] and r["body"] == "Off-by-one on rows" and r["username"] == "stu", r  # untouched fields kept
    r = client.put(f"/api/admin/notes/{n1['id']}", headers=h, json={"username": None, "tickets": []}).json()
    assert r["username"] is None and r["tickets"] == [] and r["done"], r  # now a general note
    client.post("/api/admin/accounts/test/reset", headers=h)
    client.post("/api/admin/accounts/sync", headers=h, json={"source": "stu", "target": "test"})
    assert len(client.get("/api/admin/notes", headers=h).json()["notes"]) == 2  # reset/sync leave notes alone
    assert client.delete(f"/api/admin/notes/{n1['id']}", headers=h).status_code == 200
    assert client.delete(f"/api/admin/notes/{n1['id']}", headers=h).status_code == 404
    assert client.put("/api/admin/notes/missing", headers=h, json={"done": True}).status_code == 404
    print("NOTES OK")


def test_live():
    import json
    assert client.post("/api/live/token").status_code == 401
    assert client.post("/api/live/token", headers={"X-Admin-Password": "nope"}).status_code == 401
    t = client.post("/api/live/token", headers={"X-Admin-Password": "pw"}).json()
    assert t["clientId"] == "teacher" and t["keyName"] == "appid.keyid" and "live:*" in json.loads(t["capability"]), t
    tok = client.post("/api/auth/login", json={"username": "stu", "password": "stu"}).json()["token"]
    t = client.post("/api/live/token", headers={"Authorization": f"Bearer {tok}"}).json()
    cap = json.loads(t["capability"])
    assert t["clientId"] == "stu" and cap == {"live-lobby": ["presence"], "live:stu": ["publish", "subscribe", "presence"]}, t
    print("LIVE OK")

if __name__ == "__main__":
    test_all()
    test_accounts()
    test_time_and_stars()
    test_notes()
    test_live()
