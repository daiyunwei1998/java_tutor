"""Live teacher sessions: signs Ably token requests so browsers can join realtime channels.

Vercel functions cannot hold WebSocket connections, so the realtime traffic goes through Ably (free tier).
The browser never sees ABLY_API_KEY: it asks this backend for a short-lived, signed *token request* whose
capability limits what that browser may do, then exchanges it with Ably directly.

Channels:
  live-lobby        presence only; every student on a ticket page is a member, the teacher lists them.
  live:<username>   one student's session; the teacher joins it to see/drive that student's workspace.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time

LOBBY = "live-lobby"
TEACHER_ID = "teacher"
TTL_MS = 60 * 60 * 1000  # Ably renews tokens automatically through the authCallback.


def session_channel(username: str) -> str:
    return f"live:{username}"


def capability_for(role: str, username: str | None = None) -> dict[str, list[str]]:
    if role == "teacher":
        return {LOBBY: ["subscribe", "presence"], "live:*": ["publish", "subscribe", "presence"]}
    assert username
    # A student can only announce itself in the lobby and talk on its own session channel.
    return {LOBBY: ["presence"], session_channel(username): ["publish", "subscribe", "presence"]}


def token_request(api_key: str, client_id: str, capability: dict[str, list[str]]) -> dict:
    """Builds a signed Ably TokenRequest (https://ably.com/docs/auth/token#token-request)."""
    key_name, _, key_secret = api_key.partition(":")
    if not key_name or not key_secret:
        raise ValueError("ABLY_API_KEY must look like 'appId.keyId:secret'.")
    cap = json.dumps(capability, separators=(",", ":"), sort_keys=True)
    ts = int(time.time() * 1000)
    nonce = secrets.token_hex(16)
    signing = "\n".join([key_name, str(TTL_MS), cap, client_id, str(ts), nonce]) + "\n"
    mac = base64.b64encode(hmac.new(key_secret.encode(), signing.encode(), hashlib.sha256).digest()).decode()
    return {"keyName": key_name, "ttl": TTL_MS, "capability": cap, "clientId": client_id,
            "timestamp": ts, "nonce": nonce, "mac": mac}
