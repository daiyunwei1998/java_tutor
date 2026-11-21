"""FastAPI backend: AI mentor (chat + per-exercise debug help) and the tutor's usage dashboard.

Runs locally with `uvicorn api.index:app --port 8000` and on Vercel as a Python function
(vercel.json rewrites /api/* here). Student Java code is compiled and executed in the student's
browser (CheerpJ), never here.
"""
from __future__ import annotations

import os
import secrets
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import sys
from pathlib import Path

# Vercel runs this file as a standalone Python function; make the sibling _core package importable.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from _core import accounts, live, notes, usage  # noqa: E402
from _core.config import settings  # noqa: E402
from _core.prompts import DEBUG_INSTRUCTIONS, MENTOR_BASE, number_lines  # noqa: E402

app = FastAPI(title="Java Tutor API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
usage.init(settings.database_url, settings.db_path)
accounts.init(os.getenv("AUTH_SECRET") or settings.admin_password or settings.database_url or "local-dev",
              [a.strip().lower() for a in os.getenv("SEED_ACCOUNTS", "stu,test").split(",") if a.strip()])
notes.init()

MAX_CODE_CHARS = 12_000
MAX_MESSAGE_CHARS = 2_000
MAX_HISTORY = 12

# Messages students see. Kept here so wording is consistent across chat and debug.
MSG = {
    "quota_exhausted": "The AI tutor has used up its usage for this month 🙏 Please contact your teacher. Until then, try the hints, reread the error message, or write your question down for class.",
    "rate_limited": "The AI tutor is busy right now. Please wait 30 seconds and try again. If this keeps happening, contact your teacher.",
    "daily_limit": "You have used all your AI questions for today ({limit} per day). Come back tomorrow, or try debugging it yourself first! If it is urgent, contact your teacher.",
    "not_configured": "The AI tutor is not set up yet (missing API key). Please contact your teacher.",
    "error": "The AI tutor cannot answer right now. Please try again later. If it keeps failing, contact your teacher.",
}

_client = None


def get_client():
    global _client
    if _client is None:
        from openai import OpenAI

        # max_retries=1: a hard spend limit returns 429 immediately; retrying only wastes time.
        _client = OpenAI(api_key=settings.openai_api_key, max_retries=1, timeout=60)
    return _client


# ---------- request models ----------

class Student(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=40)


class TicketContext(BaseModel):
    id: str = Field(max_length=32)
    title: str = Field(max_length=200)
    task: str = Field(default="", max_length=6000)


class SourceFile(BaseModel):
    path: str = Field(max_length=120)
    content: str = Field(max_length=MAX_CODE_CHARS)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    student: Student
    ticket: TicketContext | None = None
    files: list[SourceFile] = Field(default_factory=list, max_length=6)
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


class RunResultContext(BaseModel):
    status: str = Field(max_length=40)
    stdout: str = Field(default="", max_length=8000)
    stderr: str = Field(default="", max_length=8000)
    tests: list[dict] = Field(default_factory=list, max_length=40)


class DebugRequest(BaseModel):
    student: Student
    ticket: TicketContext
    files: list[SourceFile] = Field(min_length=1, max_length=6)
    result: RunResultContext | None = None
    question: str = Field(default="", max_length=MAX_MESSAGE_CHARS)


# ---------- helpers ----------

def _error(status_code: int, code: str, **fmt) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error_code": code, "message": MSG[code].format(**fmt)})


def _files_block(files: list[SourceFile]) -> str:
    parts = []
    for f in files:
        parts.append(f"// File: {f.path}\n{number_lines(f.content[:MAX_CODE_CHARS])}")
    return "\n\n".join(parts)


def _ticket_block(t: TicketContext | None) -> str:
    if not t:
        return "(The student is not on a ticket page right now.)"
    return f"Current ticket: {t.id} \"{t.title}\"\nTask:\n{t.task[:6000]}"


def _call_openai(kind: str, student: Student, ticket_id: str | None, messages: list[dict]):
    """Calls OpenAI and logs usage. Returns (reply, None) or (None, JSONResponse)."""
    if not settings.openai_api_key:
        usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                     model=None, status="not_configured")
        return None, _error(503, "not_configured")

    limit = settings.daily_limit_per_student
    if limit > 0 and usage.count_today(student.id) >= limit:
        usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                     model=settings.openai_model, status="daily_limit")
        return None, _error(429, "daily_limit", limit=limit)

    import openai

    try:
        resp = get_client().chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_completion_tokens=settings.max_output_tokens,
            safety_identifier=student.id,
        )
    except openai.RateLimitError as e:
        # A monthly hard limit / no credit comes back as 429 with code "insufficient_quota".
        body = getattr(e, "body", None) or {}
        code = (body.get("code") if isinstance(body, dict) else None) or getattr(e, "code", None) or ""
        text = f"{code} {e}".lower()
        is_quota = "quota" in text or "billing" in text or ("limit" in text and "spend" in text)
        status = "quota_exhausted" if is_quota else "rate_limited"
        usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                     model=settings.openai_model, status=status, error=str(e))
        return None, _error(429, status)
    except openai.AuthenticationError as e:
        usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                     model=settings.openai_model, status="not_configured", error=str(e))
        return None, _error(503, "not_configured")
    except openai.OpenAIError as e:
        usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                     model=settings.openai_model, status="error", error=str(e))
        return None, _error(502, "error")

    u = resp.usage
    usage.record(student_id=student.id, student_name=student.name, kind=kind, ticket_id=ticket_id,
                 model=resp.model, prompt_tokens=getattr(u, "prompt_tokens", 0) or 0,
                 completion_tokens=getattr(u, "completion_tokens", 0) or 0, status="ok")
    reply = (resp.choices[0].message.content or "").strip() or "(The AI gave an empty answer. Please ask again in a different way.)"
    return reply, None


# ---------- routes ----------

@app.get("/api/health")
def health():
    return {"ok": True, "ai_configured": bool(settings.openai_api_key), "model": settings.openai_model,
            "admin_configured": bool(settings.admin_password), "database": usage.backend_name(),
            "live_configured": bool(settings.ably_api_key)}


@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    system = MENTOR_BASE.format(name=req.student.name) + "\n\n" + _ticket_block(req.ticket)
    if req.files:
        system += "\n\nThe student's code in the editor (with line numbers):\n" + _files_block(req.files)
    history = [{"role": m.role, "content": m.content[:MAX_MESSAGE_CHARS * 2]} for m in req.messages[-MAX_HISTORY:]]
    reply, err = _call_openai("chat", req.student, req.ticket.id if req.ticket else None,
                              [{"role": "system", "content": system}, *history])
    return err or {"reply": reply}


@app.post("/api/ai/debug")
def ai_debug(req: DebugRequest):
    system = MENTOR_BASE.format(name=req.student.name) + "\n\n" + DEBUG_INSTRUCTIONS
    user = [_ticket_block(req.ticket), "The student's code:\n" + _files_block(req.files)]
    if req.result:
        r = req.result
        lines = [f"Last run status: {r.status}"]
        if r.stderr:
            lines.append("Compiler / error output:\n" + r.stderr[:6000])
        if r.stdout:
            lines.append("Standard output:\n" + r.stdout[:3000])
        if r.tests:
            lines.append("Test results:\n" + "\n".join(
                f"- {'PASS' if t.get('passed') else 'FAIL'} {t.get('name')}: {str(t.get('message', ''))[:400]}"
                for t in r.tests))
        user.append("\n".join(lines))
    else:
        user.append("(The student has not run the code yet.)")
    if req.question.strip():
        user.append("The student adds: " + req.question.strip())
    reply, err = _call_openai("debug", req.student, req.ticket.id,
                              [{"role": "system", "content": system}, {"role": "user", "content": "\n\n".join(user)}])
    return err or {"reply": reply}


# ---------- accounts + progress ----------

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=40)
    password: str = Field(min_length=1, max_length=100)


class ProgressPut(BaseModel):
    data: dict
    base_rev: int = Field(ge=0)


MAX_PROGRESS_BYTES = 1_000_000


def _require_user(authorization: str | None) -> str:
    token = authorization.removeprefix("Bearer ").strip() if authorization else None
    user = accounts.check_token(token)
    if not user:
        raise HTTPException(401, "Please log in again.")
    return user


@app.post("/api/auth/login")
def login(req: LoginRequest):
    token = accounts.login(req.username, req.password)
    if not token:
        raise HTTPException(401, "Wrong username or password.")
    return {"token": token, "username": req.username.strip().lower()}


@app.get("/api/progress")
def get_progress(authorization: str | None = Header(default=None)):
    return accounts.get_progress(_require_user(authorization))


@app.put("/api/progress")
def put_progress(req: ProgressPut, authorization: str | None = Header(default=None)):
    user = _require_user(authorization)
    import json

    if len(json.dumps(req.data)) > MAX_PROGRESS_BYTES:
        raise HTTPException(413, "Progress data is too large.")
    return accounts.put_progress(user, req.data, req.base_rev)


class TimePost(BaseModel):
    # "sprintId/ticketId", the same key the progress blob uses.
    ticket: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
    # One heartbeat carries at most a few minutes; the client flushes every 30 s and on tab hide.
    ms: int = Field(ge=0, le=10 * 60 * 1000)


@app.post("/api/time")
def post_time(req: TimePost, authorization: str | None = Header(default=None)):
    user = _require_user(authorization)
    if req.ms:
        accounts.add_time(user, req.ticket, req.ms)
    return {"ok": True}


# ---------- live teacher sessions (Ably) ----------

@app.post("/api/live/token")
def live_token(authorization: str | None = Header(default=None), x_admin_password: str | None = Header(default=None)):
    """Signed Ably token request. Teacher: X-Admin-Password. Student: Bearer login token."""
    if not settings.ably_api_key:
        raise HTTPException(503, "Live sessions are not set up (missing ABLY_API_KEY).")
    if x_admin_password is not None:
        _require_admin(x_admin_password)
        return live.token_request(settings.ably_api_key, live.TEACHER_ID, live.capability_for("teacher"))
    user = _require_user(authorization)
    return live.token_request(settings.ably_api_key, user, live.capability_for("student", user))


# ---------- admin ----------

def _require_admin(x_admin_password: str | None) -> None:
    if not settings.admin_password:
        raise HTTPException(503, "Set ADMIN_PASSWORD in the environment to use the admin page.")
    if not x_admin_password or not secrets.compare_digest(x_admin_password, settings.admin_password):
        raise HTTPException(401, "Wrong password.")


class SyncRequest(BaseModel):
    source: str = Field(min_length=1, max_length=40)
    target: str = Field(min_length=1, max_length=40)


@app.get("/api/admin/accounts")
def admin_accounts(x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    return {"accounts": accounts.list_accounts()}


@app.get("/api/admin/time")
def admin_time(x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    return {"time": accounts.list_time()}


@app.get("/api/admin/accounts/{username}")
def admin_account_detail(username: str, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if not accounts.exists(username):
        raise HTTPException(404, "No such account.")
    return accounts.detail(username)


@app.post("/api/admin/accounts/{username}/reset")
def admin_reset(username: str, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if not accounts.exists(username):
        raise HTTPException(404, "No such account.")
    accounts.reset(username)
    return {"ok": True, "accounts": accounts.list_accounts()}


class TicketStatusPut(BaseModel):
    ticket: str = Field(min_length=3, max_length=120)  # "sprintId/ticketId"
    status: str


@app.put("/api/admin/accounts/{username}/ticket-status")
def admin_ticket_status(username: str, req: TicketStatusPut, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if not accounts.exists(username):
        raise HTTPException(404, "No such account.")
    if req.status not in accounts.STATUSES or "/" not in req.ticket:
        raise HTTPException(400, "Invalid ticket or status.")
    return accounts.set_ticket_status(username, req.ticket, req.status)


@app.get("/api/admin/accounts/{username}/ticket")
def admin_ticket_detail(username: str, key: str, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if not accounts.exists(username):
        raise HTTPException(404, "No such account.")
    return accounts.ticket_detail(username, key)


@app.post("/api/admin/accounts/sync")
def admin_sync(req: SyncRequest, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if req.source == req.target or not accounts.exists(req.source) or not accounts.exists(req.target):
        raise HTTPException(400, "Invalid accounts.")
    accounts.copy(req.source, req.target)
    return {"ok": True, "accounts": accounts.list_accounts()}


@app.get("/api/admin/usage")
def admin_usage(x_admin_password: str | None = Header(default=None), days: int = 30):
    _require_admin(x_admin_password)
    data = usage.summary(settings.price_input_per_1m, settings.price_output_per_1m, days=max(1, min(days, 365)))
    data["config"] = {
        "model": settings.openai_model,
        "ai_configured": bool(settings.openai_api_key),
        "daily_limit_per_student": settings.daily_limit_per_student,
        "price_input_per_1m": settings.price_input_per_1m,
        "price_output_per_1m": settings.price_output_per_1m,
        "database": usage.backend_name(),
    }
    return data


# ---------- teacher notes ----------

class NoteCreate(BaseModel):
    username: str | None = Field(default=None, max_length=40)
    body: str = Field(min_length=1, max_length=10_000)
    tickets: list[str] = Field(default_factory=list, max_length=50)


class NoteUpdate(BaseModel):
    """Only the fields that are sent change. Send username null to make it a general note."""
    username: str | None = Field(default=None, max_length=40)
    body: str | None = Field(default=None, min_length=1, max_length=10_000)
    tickets: list[str] | None = Field(default=None, max_length=50)
    done: bool | None = None


def _note_account(username: str | None) -> str | None:
    username = (username or "").strip().lower() or None
    if username and not accounts.exists(username):
        raise HTTPException(400, "No such account.")
    return username


def _check_tickets(tickets: list[str]) -> list[str]:
    if any(len(t) > 80 for t in tickets):
        raise HTTPException(400, "Ticket key too long.")
    return tickets


@app.get("/api/admin/notes")
def admin_notes(username: str | None = None, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    return {"notes": notes.list_notes(username.strip().lower() if username else None)}


@app.post("/api/admin/notes")
def admin_note_create(req: NoteCreate, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    body = req.body.strip()
    if not body:
        raise HTTPException(400, "The note is empty.")
    return notes.create(_note_account(req.username), body, _check_tickets(req.tickets))


@app.put("/api/admin/notes/{note_id}")
def admin_note_update(note_id: str, req: NoteUpdate, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    changes: dict = {}
    sent = req.model_fields_set
    if "username" in sent:
        changes["username"] = _note_account(req.username)
    if "body" in sent and req.body is not None:
        if not req.body.strip():
            raise HTTPException(400, "The note is empty.")
        changes["body"] = req.body.strip()
    if "tickets" in sent and req.tickets is not None:
        changes["tickets"] = _check_tickets(req.tickets)
    if "done" in sent and req.done is not None:
        changes["done"] = req.done
    note = notes.update(note_id, **changes)
    if not note:
        raise HTTPException(404, "No such note.")
    return note


@app.delete("/api/admin/notes/{note_id}")
def admin_note_delete(note_id: str, x_admin_password: str | None = Header(default=None)):
    _require_admin(x_admin_password)
    if not notes.delete(note_id):
        raise HTTPException(404, "No such note.")
    return {"ok": True}
