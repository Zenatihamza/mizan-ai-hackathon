"""Legal Life Simulator — educational scenario RPG with Arabic narration.

Adds per-user progress (XP + completed scenarios) saved to the database.
"""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, RpgProgress
from app.security import get_current_user

router = APIRouter()

_SCN_PATH = Path(__file__).parent.parent / "data" / "scenarios.json"


def _load():
    with open(_SCN_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class Choice(BaseModel):
    id: str
    label: str


class ScenarioPublic(BaseModel):
    id: str
    day: int
    title: str
    title_ar: Optional[str] = None
    domain: str
    story: str
    story_ar: Optional[str] = None
    question: str
    question_ar: Optional[str] = None
    choices: List[Choice]
    total: int
    index: int


class AnswerRequest(BaseModel):
    scenario_id: str
    choice_id: str


class AnswerResponse(BaseModel):
    correct: bool
    xp: int
    feedback: str
    feedback_ar: Optional[str] = None
    citation: Optional[str] = None
    lesson: Optional[str] = None
    lesson_ar: Optional[str] = None


class Level(BaseModel):
    name: str
    name_ar: str
    min_xp: int
    emoji: str


class ProgressOut(BaseModel):
    xp: int
    completed: List[str]


class ProgressIn(BaseModel):
    xp: int
    completed: List[str]


@router.get("/scenarios", response_model=List[ScenarioPublic])
def list_scenarios():
    data = _load()
    scn = data["scenarios"]
    total = len(scn)
    return [
        ScenarioPublic(
            id=s["id"],
            day=s["day"],
            title=s["title"],
            title_ar=s.get("title_ar"),
            domain=s["domain"],
            story=s["story"],
            story_ar=s.get("story_ar"),
            question=s["question"],
            question_ar=s.get("question_ar"),
            choices=[Choice(id=c["id"], label=c["label"]) for c in s["choices"]],
            total=total,
            index=i + 1,
        )
        for i, s in enumerate(scn)
    ]


@router.post("/answer", response_model=AnswerResponse)
def answer(req: AnswerRequest):
    data = _load()
    scenario = next((s for s in data["scenarios"] if s["id"] == req.scenario_id), None)
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    choice = next((c for c in scenario["choices"] if c["id"] == req.choice_id), None)
    if not choice:
        raise HTTPException(404, "Choice not found")
    return AnswerResponse(
        correct=choice["correct"],
        xp=choice["xp"],
        feedback=choice["feedback"],
        feedback_ar=choice.get("feedback_ar"),
        citation=choice.get("citation"),
        lesson=scenario.get("lesson"),
        lesson_ar=scenario.get("lesson_ar"),
    )


@router.get("/levels", response_model=List[Level])
def levels():
    return _load()["levels"]


@router.get("/progress", response_model=ProgressOut)
def get_progress(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    prog = db.query(RpgProgress).filter(RpgProgress.user_id == user.id).first()
    if not prog:
        return ProgressOut(xp=0, completed=[])
    try:
        completed = json.loads(prog.completed or "[]")
    except Exception:
        completed = []
    return ProgressOut(xp=prog.xp, completed=completed)


@router.post("/progress", response_model=ProgressOut)
def save_progress(
    body: ProgressIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prog = db.query(RpgProgress).filter(RpgProgress.user_id == user.id).first()
    if not prog:
        prog = RpgProgress(user_id=user.id)
        db.add(prog)
    prog.xp = max(0, body.xp)
    prog.completed = json.dumps(sorted(set(body.completed)), ensure_ascii=False)
    db.commit()
    db.refresh(prog)
    return ProgressOut(xp=prog.xp, completed=json.loads(prog.completed))
