"""Legal procedure GPS — describe a problem, get the step-by-step path."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_PROCS_PATH = Path(__file__).parent.parent / "data" / "procedures.json"


def _load_procedures():
    with open(_PROCS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["procedures"]


class SearchRequest(BaseModel):
    query: str


class Step(BaseModel):
    step: int
    label: str
    detail: str


class Procedure(BaseModel):
    id: str
    title: str
    title_ar: Optional[str] = None
    domain: str
    steps: List[Step]
    where: str
    documents: List[str]
    delay: str
    cost: str
    official_url: Optional[str] = None
    legal_basis: List[str] = []
    match_score: int = 0


def _score(query: str, proc: dict) -> int:
    q = query.lower()
    score = 0
    for kw in proc.get("keywords", []):
        if kw.lower() in q:
            score += 10
    title_words = proc["title"].lower().split()
    for w in q.split():
        if len(w) > 3 and w in proc["title"].lower():
            score += 3
    if proc["domain"].lower() in q:
        score += 5
    return score


@router.post("/search", response_model=List[Procedure])
def search(req: SearchRequest):
    procs = _load_procedures()
    scored = []
    for p in procs:
        s = _score(req.query, p)
        if s > 0:
            scored.append((s, p))
    scored.sort(key=lambda x: -x[0])
    if not scored:
        scored = [(1, p) for p in procs[:3]]
    out = []
    for score, p in scored[:4]:
        out.append(
            Procedure(
                id=p["id"],
                title=p["title"],
                title_ar=p.get("title_ar"),
                domain=p["domain"],
                steps=[Step(**s) for s in p["steps"]],
                where=p["where"],
                documents=p["documents"],
                delay=p["delay"],
                cost=p["cost"],
                official_url=p.get("official_url"),
                legal_basis=p.get("legal_basis", []),
                match_score=score,
            )
        )
    return out


@router.get("/all", response_model=List[Procedure])
def list_all():
    procs = _load_procedures()
    return [
        Procedure(
            id=p["id"],
            title=p["title"],
            title_ar=p.get("title_ar"),
            domain=p["domain"],
            steps=[Step(**s) for s in p["steps"]],
            where=p["where"],
            documents=p["documents"],
            delay=p["delay"],
            cost=p["cost"],
            official_url=p.get("official_url"),
            legal_basis=p.get("legal_basis", []),
        )
        for p in procs
    ]
