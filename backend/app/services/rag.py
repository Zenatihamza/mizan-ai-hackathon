"""Lightweight RAG over the Algerian legal corpus.

Uses ChromaDB with sentence-transformers if available; falls back to a
naive keyword search so the system works even without the heavy deps.
"""
import json
from pathlib import Path
from typing import List, Dict

CORPUS_DIR = Path(__file__).parent.parent / "data" / "corpus"

_HAS_CHROMA = False
_collection = None

try:
    import chromadb
    from chromadb.utils import embedding_functions
    _HAS_CHROMA = True
except Exception:
    _HAS_CHROMA = False


def _load_articles() -> List[Dict]:
    """Load every JSON file in the corpus dir. Each file = a code."""
    articles: List[Dict] = []
    if not CORPUS_DIR.exists():
        return articles
    for path in CORPUS_DIR.glob("*.json"):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        code_name = data.get("code", path.stem)
        for art in data.get("articles", []):
            articles.append(
                {
                    "code": code_name,
                    "article": art["article"],
                    "text": art["text"],
                    "topics": art.get("topics", []),
                }
            )
    return articles


def _init_chroma():
    global _collection
    if _collection is not None or not _HAS_CHROMA:
        return
    try:
        client = chromadb.Client()
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = client.get_or_create_collection(name="algerian_law", embedding_function=ef)
        if _collection.count() == 0:
            articles = _load_articles()
            if articles:
                _collection.add(
                    ids=[f"{a['code']}-{a['article']}" for a in articles],
                    documents=[a["text"] for a in articles],
                    metadatas=[
                        {"code": a["code"], "article": a["article"], "topics": ",".join(a["topics"])}
                        for a in articles
                    ],
                )
    except Exception:
        _collection = None


def _keyword_search(query: str, k: int = 4) -> List[Dict]:
    articles = _load_articles()
    q_words = {w.lower() for w in query.split() if len(w) > 3}
    scored = []
    for a in articles:
        text_l = a["text"].lower()
        score = sum(1 for w in q_words if w in text_l)
        score += sum(2 for t in a["topics"] if any(w in t.lower() for w in q_words))
        if score > 0:
            scored.append((score, a))
    scored.sort(key=lambda x: -x[0])
    return [a for _, a in scored[:k]]


def retrieve(query: str, k: int = 4) -> List[Dict]:
    """Return the top-k articles relevant to `query`."""
    if _HAS_CHROMA:
        _init_chroma()
    if _collection is not None:
        try:
            res = _collection.query(query_texts=[query], n_results=k)
            out = []
            for doc, meta in zip(res["documents"][0], res["metadatas"][0]):
                out.append(
                    {
                        "code": meta["code"],
                        "article": meta["article"],
                        "text": doc,
                        "topics": meta.get("topics", "").split(","),
                    }
                )
            return out
        except Exception:
            pass
    return _keyword_search(query, k=k)
