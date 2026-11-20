"""API smoke tests without a real OpenAI key (fake client). Run from repo root: python tools/test_api.py"""
import os, sys, tempfile, types
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.pop("DATABASE_URL", None); os.environ.pop("POSTGRES_URL", None)
os.environ["USAGE_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "u.db")
os.environ["OPENAI_API_KEY"] = "sk-test-not-real"
os.environ["ADMIN_PASSWORD"] = "pw"
os.environ["AI_DAILY_LIMIT_PER_STUDENT"] = "3"
import httpx, openai
from fastapi.testclient import TestClient
from api import index as main

client = TestClient(main.app)
student = {"id": "stu-1", "name": "小明"}

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
                                     choices=[types.SimpleNamespace(message=types.SimpleNamespace(content="試試看第 3 行的 r <= m.length"))])

fake = FakeCompletions()
main._client = types.SimpleNamespace(chat=types.SimpleNamespace(completions=fake))

def test_all():
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "為什麼會 out of bounds?"}]})
    assert r.status_code == 200 and "第 3 行" in r.json()["reply"], r.text
    r = client.post("/api/ai/debug", json={"student": student, "ticket": {"id": "PF-102", "title": "t", "task": "x"},
                                            "files": [{"path": "Grid.java", "content": "class Grid {}"}],
                                            "result": {"status": "compile_error", "stderr": "error"}})
    assert r.status_code == 200, r.text
    fake.mode = "quota"
    r = client.post("/api/ai/chat", json={"student": student, "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 429 and r.json()["error_code"] == "quota_exhausted" and "聯絡老師" in r.json()["message"], r.text
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
    assert d["by_student"][0]["name"] == "小明" and d["last_quota_exhausted"], d
    print("ALL OK", d["month"], d["failures"])

if __name__ == "__main__":
    test_all()
