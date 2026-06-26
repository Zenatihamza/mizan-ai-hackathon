"""Emergency Mode — legal first-aid kit. Returns urgent, structured guidance."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_PATH = Path(__file__).parent.parent / "data" / "emergencies.json"


def _load():
    with open(_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class Bilingual(BaseModel):
    fr: str
    ar: str


class Authority(BaseModel):
    name: Bilingual
    phone: str


class Situation(BaseModel):
    id: str
    icon: str
    label: Bilingual
    rights: List[Bilingual]
    donts: List[Bilingual]
    documents: List[Bilingual]
    where: Bilingual
    authorities: List[Authority]


class Question(BaseModel):
    id: str
    fr: str
    ar: str


class EmergencyData(BaseModel):
    situations: List[Situation]
    questions: List[Question]


@router.get("/situations", response_model=EmergencyData)
def situations():
    return _load()
