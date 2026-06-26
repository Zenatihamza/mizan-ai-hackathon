# JusticIA ⚖️

**Le droit algérien, accessible — en français et en arabe.**
Hackathon Nous · Challenge 1 — Legal Access & Justice.

Une plateforme avec comptes utilisateurs et 4 modules :

- **Assistant** — un chatbot juridique avec **historique** : pose ta question, reçois tes droits, les articles de loi et les démarches.
- **Scanner** — analyse un contrat photo, détecte les clauses abusives/illégales, cite l'article, propose une réécriture équitable.
- **Démarches (GPS)** — décris ton problème, reçois la procédure exacte (où, quoi, combien de temps, combien ça coûte).
- **Apprendre** — un simulateur éducatif qui fait vivre des situations légales réelles et enseigne le droit, **avec progression sauvegardée**.

Couche transversale : **explication vocale en arabe** sur chaque module (scanner, assistant, simulateur) via la Web Speech API du navigateur.

---

## Architecture

```
mizan-ai/
├── frontend/   # React + Vite + TypeScript + Tailwind
└── backend/    # FastAPI + SQLite (SQLAlchemy) + OCR + RAG + LLM
```

- **Frontend** : `http://localhost:5173`
- **Backend** : `http://localhost:8000` (proxifié par Vite sous `/api`)
- **Base de données** : SQLite (`backend/app/data/mizan.db`, créée automatiquement)

### Comptes & sécurité
- Inscription / connexion par email + mot de passe.
- Mots de passe hashés (PBKDF2, stdlib — aucune dépendance native).
- Sessions par token JWT (7 jours), stocké côté navigateur.
- Chaque utilisateur a ses propres conversations et sa progression.

---

## Prérequis

| Outil | Version | Pourquoi |
|-------|---------|----------|
| Python | ≥ 3.10 | Backend |
| Node.js | ≥ 18 | Frontend |
| Tesseract OCR | ≥ 5 | OCR arabe + français *(optionnel)* |
| Ollama | dernier | LLM local gratuit *(optionnel)* |

Tesseract et Ollama sont **optionnels** : sans eux, l'app marche en mode démo (OCR → contrat pré-cuisiné, réponses calibrées avec vraies citations). Voir plus bas.

---

## Lancer le projet

### Backend (terminal 1)

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Test : `http://localhost:8000/api/health` → `{"status":"ok",...}`.
La base de données et les tables sont créées automatiquement au démarrage.

### Frontend (terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

Ouvre `http://localhost:5173` → crée un compte → tu arrives sur l'accueil.

---

## Modes de fonctionnement

`backend/.env` :

| Variable | Valeurs | Effet |
|---|---|---|
| `LLM_BACKEND` | `mock` *(défaut)* / `ollama` | Source du raisonnement |
| `OLLAMA_MODEL` | `llama3.1:8b`, `mistral`… | Modèle si Ollama actif |
| `TESSERACT_PATH` | chemin absolu | Exécutable Tesseract |
| `DATABASE_URL` | `sqlite:///./app/data/mizan.db` | Base de données |
| `JWT_SECRET` | chaîne secrète | Signature des tokens — **à changer** |

**Pour la démo jury : garde `LLM_BACKEND=mock`.** Les réponses (scanner + assistant) sont calibrées avec de vraies citations d'articles, zéro risque d'hallucination en direct.

### Activer le vrai LLM (optionnel)
```bash
# https://ollama.com/download
ollama pull llama3.1:8b
ollama serve
# puis dans .env : LLM_BACKEND=ollama
```

---

## La voix arabe

Implémentée côté navigateur via la **Web Speech API** — gratuit, sans clé API. Le texte lu est en **arabe** (et non du français lu par une voix arabe).

> ⚠️ Les navigateurs n'ont pas de voix « darija » dédiée. On lit de l'arabe standard (compréhensible par tous). Pour la meilleure qualité sur Windows :
> `Paramètres → Heure & langue → Voix → Ajouter des voix → Arabe`. Chrome/Edge ont de meilleures voix arabes que Firefox.

---

## Endpoints API (extrait)

| Méthode | Chemin | Rôle |
|---|---|---|
| `POST` | `/api/auth/register` · `/api/auth/login` | Créer un compte / se connecter |
| `GET`  | `/api/auth/me` | Utilisateur courant |
| `POST` | `/api/chat/message` | Envoyer un message (crée la conversation si besoin) |
| `GET`  | `/api/chat/conversations` | Historique des conversations |
| `POST` | `/api/scanner/analyze` · `GET /api/scanner/demo` | Analyse de contrat |
| `POST` | `/api/gps/search` | Procédures pertinentes |
| `GET`  | `/api/rpg/scenarios` · `POST /api/rpg/answer` | Simulateur |
| `GET/POST` | `/api/rpg/progress` | Charger / sauver la progression |

Swagger complet : `http://localhost:8000/docs`.

---

## Données

- `backend/app/data/corpus/` — articles de loi (travail, civil, consommation)
- `backend/app/data/procedures.json` — démarches GPS
- `backend/app/data/scenarios.json` — scénarios du simulateur (FR + AR + leçons)

**⚠️ Les articles seedés sont illustratifs pour la démo.** Vérifie-les contre les textes officiels ([joradp.dz](https://www.joradp.dz)) avant tout usage réel.

---

## Script de démo (5 min)

1. **Compte** — crée un compte en direct (montre que c'est une vraie app multi-utilisateurs).
2. **Assistant** — tape « mon propriétaire garde ma caution » → réponse + article cité + bouton 🔊 arabe. Montre l'historique à gauche.
3. **Scanner** — onglet Scanner → « Lancer la démo » → score bas + clauses rouges → clique une clause → citation + réécriture + 🔊 arabe.
4. **Apprendre** — 1 scénario → bonne réponse → la leçon s'affiche et se lit en arabe → l'XP monte (progression sauvegardée sur le compte).
5. **Clôture** — « chaque réponse cite la loi, escalade vers l'aide juridictionnelle en cas de doute, et informe sans remplacer un avocat. »

---

*JusticIA — parce que comprendre le droit ne devrait pas être un privilège.*

