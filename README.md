# Mizan AI ⚖️

**Une couche de compréhension juridique pour l'Algérie.**
Hackathon Nous · Challenge 1 — Legal Access & Justice.

Trois modules dans une seule plateforme :
- **Scanner** — analyse un contrat photo, détecte les clauses abusives, cite l'article de loi, propose une réécriture équitable.
- **GPS juridique** — décris ton problème en langage naturel, reçois la procédure exacte (où, quoi, combien de temps, combien ça coûte).
- **Simulateur** — un RPG qui te fait vivre des situations légales réelles et t'apprend tes droits.

Couche transversale : **voix en darija** sur chaque module via la Web Speech API du navigateur.

---

## Architecture

```
mizan-ai/
├── frontend/         # React + Vite + TypeScript + Tailwind
└── backend/          # FastAPI + Tesseract OCR + ChromaDB RAG + Ollama
```

- **Frontend** sur `http://localhost:5173`
- **Backend** sur `http://localhost:8000` (proxifié par Vite sous `/api`)

---

## Prérequis

| Outil | Version | Pourquoi |
|-------|---------|----------|
| Node.js | ≥ 18 | Frontend |
| Python | ≥ 3.10 | Backend |
| Tesseract OCR | ≥ 5 | OCR arabe + français |
| Ollama *(optionnel)* | dernier | LLM local gratuit |

### 1. Installer Node.js

Télécharge l'installeur LTS depuis [nodejs.org](https://nodejs.org). Vérifie :

```bash
node --version
npm --version
```

### 2. Installer Tesseract (Windows)

1. Télécharge l'installeur depuis [github.com/UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
2. **Coche les langues `Arabic` et `French`** pendant l'installation.
3. Note le chemin (par défaut `C:\Program Files\Tesseract-OCR\tesseract.exe`).
4. Mets ce chemin dans `backend/.env`.

> **Sans Tesseract** : l'app marche quand même — l'OCR retombe sur un contrat de démo pré-cuisiné. Tu peux faire toute la démo Scanner sans avoir installé Tesseract.

### 3. Installer Ollama *(optionnel — recommandé pour le mode "vrai LLM")*

```bash
# Télécharge depuis https://ollama.com/download
# Puis :
ollama pull llama3.1:8b
ollama serve   # tourne en arrière-plan
```

> **Sans Ollama** : laisse `LLM_BACKEND=mock` dans `.env`. La démo Scanner utilise une analyse experte pré-calculée pour le contrat de démo. **Recommandé pour la présentation jury** — zéro risque que le modèle crashe sur scène.

---

## Lancer le projet

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # PowerShell : venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env           # puis édite .env si besoin
uvicorn app.main:app --reload --port 8000
```

Test rapide : ouvre `http://localhost:8000/api/health` → doit renvoyer `{"status":"ok",...}`.

### Frontend

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev
```

Ouvre `http://localhost:5173`.

---

## Modes de fonctionnement

Configurés via `backend/.env` :

| Variable | Valeurs | Effet |
|---|---|---|
| `LLM_BACKEND` | `mock` *(défaut)* / `ollama` | Source du raisonnement IA |
| `OLLAMA_MODEL` | `llama3.1:8b` *(défaut)*, `mistral`, etc. | Modèle utilisé si Ollama actif |
| `TESSERACT_PATH` | chemin absolu | Chemin de l'exécutable Tesseract |

**Pour la démo jury :** garde `LLM_BACKEND=mock`. Les réponses sur le contrat de démo sont soigneusement calibrées avec de vraies citations d'articles, zéro risque de hallucination en direct.

---

## Endpoints API

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET`  | `/api/health` | Ping + état du LLM |
| `POST` | `/api/scanner/analyze` | Upload image → analyse complète (multipart) |
| `GET`  | `/api/scanner/demo` | Renvoie l'analyse démo sans upload |
| `POST` | `/api/gps/search` | Body `{query}` → procédures triées |
| `GET`  | `/api/gps/all` | Liste toutes les procédures |
| `GET`  | `/api/rpg/scenarios` | Liste les scénarios du jeu |
| `POST` | `/api/rpg/answer` | Body `{scenario_id, choice_id}` → feedback + XP |
| `GET`  | `/api/rpg/levels` | Liste les niveaux et seuils XP |

Docs auto Swagger : `http://localhost:8000/docs`.

---

## Données légales

Le corpus se trouve dans `backend/app/data/corpus/` — un fichier JSON par code :

- `labor_code.json` — Code du travail (Loi 90-11)
- `civil_code.json` — Code civil (Ordonnance 75-58)
- `consumer_code.json` — Protection du consommateur (Loi 09-03)

**⚠️ Important** : les articles seedés sont **illustratifs pour la démo**. Vérifie-les contre les textes officiels avant tout usage en production. Ajouter un nouvel article = un nouvel objet dans le JSON, l'index RAG le recharge au prochain démarrage.

Données démo :
- `data/procedures.json` — 5 procédures GPS
- `data/scenarios.json` — 4 scénarios + 4 niveaux RPG

---

## La voix darija

Implémentée 100% côté navigateur via la **Web Speech API** — gratuit, aucune clé API.

**Pour une meilleure qualité de voix arabe sur Windows :**
`Paramètres → Heure & langue → Voix → Ajouter des voix → Arabe`.

Chrome et Edge ont de meilleures voix arabes intégrées que Firefox.

---

## Script de démo (5 min)

1. **0:00–0:30** — Hook : "Karim, ouvrier à Djelfa, signe un contrat qu'il ne comprend pas."
2. **0:30–1:30** — Onglet **Scanner** → "Lancer la démo" → score 33/100 + clauses rouges visibles instantanément.
3. **1:30–2:30** — Cliquer une clause rouge → citations d'articles + réécriture équitable. **Appuyer sur Volume2** → la darija parle.
4. **2:30–3:30** — Onglet **GPS** → tape "mon patron refuse de payer les heures sup" → la procédure complète apparaît.
5. **3:30–4:30** — Onglet **Simulateur** → 1 scénario complet, montrer XP qui monte et la barre de niveau.
6. **4:30–5:00** — Slide finale : RAG ancré dans les codes, escalade vers l'aide juridictionnelle quand l'IA n'est pas sûre, et : *"on informe, on ne remplace pas un avocat."*

---

## Pour aller plus loin (post-hackathon)

- Brancher un OCR plus robuste pour l'arabe manuscrit (PaddleOCR, Google Vision)
- Vrai TTS darija de qualité production (Coqui, ElevenLabs)
- Vrai corpus complet des codes algériens depuis [joradp.dz](https://www.joradp.dz)
- Connexion à l'API officielle Dzair Digital Services pour les démarches en ligne
- Fine-tuning d'un petit modèle (Qwen2.5 7B) sur le corpus juridique algérien pour réduire les hallucinations

---

*Mizan AI — parce que comprendre le droit ne devrait pas être un privilège.*
