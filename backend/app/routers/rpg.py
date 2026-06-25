"""Legal Life Simulator — scenario-based RPG that teaches Algerian law."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_SCN_PATH = Path(__file__).parent.parent / "data" / "scenarios.json"


def _load():
    with open(_SCN_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class Choice(BaseModel):
    id: str
    label: str


class ScenarioPublic(BaseModel):
    """Scenario sent to the client — without the correct answer flags."""
    id: str
    day: int
    title: str
    story: str
    question: str
    choices: List[Choice]
    total: int  # total scenarios available
    index: int  # 1-based position


class AnswerRequest(BaseModel):
    scenario_id: str
    choice_id: str


class AnswerResponse(BaseModel):
    correct: bool
    xp: int
    feedback: str
    citation: Optional[str] = None


class Level(BaseModel):
    name: str
    name_ar: str
    min_xp: int
    emoji: str


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
            story=s["story"],
            question=s["question"],
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
        citation=choice.get("citation"),
    )


@router.get("/levels", response_model=List[Level])
def levels():
    return _load()["levels"]
