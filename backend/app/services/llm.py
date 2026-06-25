"""LLM client with mock fallback so the demo never crashes on stage."""
import json
import httpx
from typing import Optional

from app.config import LLM_BACKEND, OLLAMA_URL, OLLAMA_MODEL


SYSTEM_PROMPT = """You are a legal-aid assistant for Algerian citizens.
Be concise, factual, and cite Algerian law articles when relevant.
Output strict JSON when asked. Never invent article numbers."""


def _ollama_generate(prompt: str, system: str = SYSTEM_PROMPT, json_mode: bool = False) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "system": system,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2},
    }
    if json_mode:
        payload["format"] = "json"
    try:
        r = httpx.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=60.0)
        r.raise_for_status()
        return r.json().get("response", "")
    except Exception as e:
        return ""


def generate(prompt: str, system: str = SYSTEM_PROMPT, json_mode: bool = False) -> str:
    """Generate text from the configured backend. Returns '' if backend fails."""
    if LLM_BACKEND == "ollama":
        return _ollama_generate(prompt, system=system, json_mode=json_mode)
    return ""


def generate_json(prompt: str, system: str = SYSTEM_PROMPT) -> Optional[dict]:
    """Generate and parse JSON. Returns None on failure (caller should fall back to mock)."""
    raw = generate(prompt, system=system, json_mode=True)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(raw[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None
