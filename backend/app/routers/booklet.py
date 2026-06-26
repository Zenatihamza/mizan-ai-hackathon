"""Booklet — a browsable reference of every law article in the corpus."""
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_CORPUS_DIR = Path(__file__).parent.parent / "data" / "corpus"


class Article(BaseModel):
    article: str
    text: str
    topics: List[str] = []


class Code(BaseModel):
    code: str
    code_ar: Optional[str] = None
    reference: Optional[str] = None
    article_count: int
    articles: List[Article]


@router.get("/codes", response_model=List[Code])
def codes():
    out: List[Code] = []
    if not _CORPUS_DIR.exists():
        return out
    for path in sorted(_CORPUS_DIR.glob("*.json")):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        arts = [
            Article(article=a["article"], text=a["text"], topics=a.get("topics", []))
            for a in data.get("articles", [])
        ]
        out.append(
            Code(
                code=data.get("code", path.stem),
                code_ar=data.get("code_ar"),
                reference=data.get("reference"),
                article_count=len(arts),
                articles=arts,
            )
        )
    return out
