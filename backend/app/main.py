from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.routers import scanner, gps, rpg

app = FastAPI(
    title="Mizan AI",
    description="Legal access platform for Algerian citizens",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scanner.router, prefix="/api/scanner", tags=["scanner"])
app.include_router(gps.router, prefix="/api/gps", tags=["gps"])
app.include_router(rpg.router, prefix="/api/rpg", tags=["rpg"])


@app.get("/")
def root():
    return {"name": "Mizan AI", "status": "ok"}


@app.get("/api/health")
def health():
    from app.config import LLM_BACKEND, OLLAMA_MODEL
    return {"status": "ok", "llm_backend": LLM_BACKEND, "model": OLLAMA_MODEL}
