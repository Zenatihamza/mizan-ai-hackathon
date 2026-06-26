from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.database import init_db
from app.routers import scanner, gps, rpg, auth, chat, emergency, booklet

app = FastAPI(
    title="Mizan",
    description="Plateforme d'accès au droit pour les citoyens algériens",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["scanner"])
app.include_router(gps.router, prefix="/api/gps", tags=["gps"])
app.include_router(rpg.router, prefix="/api/rpg", tags=["rpg"])
app.include_router(emergency.router, prefix="/api/emergency", tags=["emergency"])
app.include_router(booklet.router, prefix="/api/booklet", tags=["booklet"])


@app.get("/")
def root():
    return {"name": "Mizan", "status": "ok"}


@app.get("/api/health")
def health():
    from app.config import LLM_BACKEND, OLLAMA_MODEL
    return {"status": "ok", "llm_backend": LLM_BACKEND, "model": OLLAMA_MODEL}
