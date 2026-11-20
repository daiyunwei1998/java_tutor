"""FastAPI backend: AI mentor (chat + per-exercise debug help) and the tutor's usage dashboard.

Runs locally with `uvicorn api.index:app --port 8000` and on Vercel as a Python function
(vercel.json rewrites /api/* here). Student Java code is compiled and executed in the student's
browser (CheerpJ), never here.
"""
from __future__ import annotations

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

from _core import usage  # noqa: E402
from _core.config import settings  # noqa: E402
from _core.prompts import DEBUG_INSTRUCTIONS, MENTOR_BASE, number_lines  # noqa: E402

app = FastAPI(title="Java Tutor API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
usage.init(settings.database_url, settings.db_path)

MAX_CODE_CHARS = 12_000
MAX_MESSAGE_CHARS = 2_000
MAX_HISTORY = 12

# Messages students see. Kept here so wording is consistent across chat and debug.
MSG = {
    "quota_exhausted": "AI 助教這個月的使用額度已經用完了 🙏 請聯絡老師。在那之前，可以先看提示、重讀錯誤訊息，或把問題記下來上課問。",
    "rate_limited": "AI 助教現在有點忙，請等 30 秒再試一次。如果一直出現這個訊息，請聯絡老師。",
    "daily_limit": "你今天的 AI 提問次數已經用完了（每人每天 {limit} 次），明天再來，或先試著自己 debug 看看！有急事請聯絡老師。",
    "not_configured": "AI 助教還沒設定好（缺少 API key），請聯絡老師。",
    "error": "AI 助教暫時無法回應，請稍後再試。如果一直失敗，請聯絡老師。",
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
        return "（學生目前不在任何 ticket 頁面。）"
    return f"目前的 ticket：{t.id}「{t.title}」\n任務說明：\n{t.task[:6000]}"


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
    reply = (resp.choices[0].message.content or "").strip() or "（AI 沒有回覆內容，請換個方式再問一次。）"
    return reply, None


# ---------- routes ----------

@app.get("/api/health")
def health():
    return {"ok": True, "ai_configured": bool(settings.openai_api_key), "model": settings.openai_model,
            "admin_configured": bool(settings.admin_password), "database": usage.backend_name()}


@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    system = MENTOR_BASE.format(name=req.student.name) + "\n\n" + _ticket_block(req.ticket)
    if req.files:
        system += "\n\n學生目前編輯器裡的程式碼（含行號）：\n" + _files_block(req.files)
    history = [{"role": m.role, "content": m.content[:MAX_MESSAGE_CHARS * 2]} for m in req.messages[-MAX_HISTORY:]]
    reply, err = _call_openai("chat", req.student, req.ticket.id if req.ticket else None,
                              [{"role": "system", "content": system}, *history])
    return err or {"reply": reply}


@app.post("/api/ai/debug")
def ai_debug(req: DebugRequest):
    system = MENTOR_BASE.format(name=req.student.name) + "\n\n" + DEBUG_INSTRUCTIONS
    user = [_ticket_block(req.ticket), "學生的程式碼：\n" + _files_block(req.files)]
    if req.result:
        r = req.result
        lines = [f"最近一次執行狀態：{r.status}"]
        if r.stderr:
            lines.append("編譯器 / 錯誤輸出：\n" + r.stderr[:6000])
        if r.stdout:
            lines.append("標準輸出：\n" + r.stdout[:3000])
        if r.tests:
            lines.append("測試結果：\n" + "\n".join(
                f"- {'PASS' if t.get('passed') else 'FAIL'} {t.get('name')}: {str(t.get('message', ''))[:400]}"
                for t in r.tests))
        user.append("\n".join(lines))
    else:
        user.append("（學生還沒有執行過程式。）")
    if req.question.strip():
        user.append("學生補充的問題：" + req.question.strip())
    reply, err = _call_openai("debug", req.student, req.ticket.id,
                              [{"role": "system", "content": system}, {"role": "user", "content": "\n\n".join(user)}])
    return err or {"reply": reply}


@app.get("/api/admin/usage")
def admin_usage(x_admin_password: str | None = Header(default=None), days: int = 30):
    if not settings.admin_password:
        raise HTTPException(503, "請先在 .env 設定 ADMIN_PASSWORD 才能使用 admin 頁面。")
    if not x_admin_password or not secrets.compare_digest(x_admin_password, settings.admin_password):
        raise HTTPException(401, "密碼錯誤")
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
