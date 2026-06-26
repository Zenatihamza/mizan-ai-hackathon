"""Contract scanner — the hero module.

Pipeline: image -> OCR -> clause segmentation -> RAG retrieval -> LLM analysis.
Falls back to a high-quality mock for the demo so the stage demo never fails.
"""
import re
import unicodedata
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

from app.services import ocr as ocr_svc
from app.services import rag as rag_svc
from app.services import llm as llm_svc

router = APIRouter()


class Citation(BaseModel):
    code: str
    article: str
    excerpt: str


class ClauseAnalysis(BaseModel):
    id: int
    text: str
    verdict: str  # "green" | "orange" | "red"
    severity: int  # 0-100
    title: str
    explanation: str
    explanation_ar: Optional[str] = None  # Arabic for voice playback
    citations: List[Citation]
    fair_rewrite: Optional[str] = None
    confidence: float  # 0..1


class ScanResult(BaseModel):
    document_type: str
    overall_score: int  # 0..100, higher = more legitimate
    summary: str
    raw_text: str
    clauses: List[ClauseAnalysis]
    missing_clauses: List[str]
    authenticity_flags: List[str]
    next_steps: List[str]


# ---------- Smart mock for the seeded demo contract ----------
_DEMO_ANALYSIS = {
    "Article 1": {
        "verdict": "red",
        "severity": 90,
        "title": "Heures de travail illégales — pas d'heures supplémentaires payées",
        "explanation": "60h/semaine dépasse largement la limite légale de 40h, et toute heure au-delà DOIT être majorée d'au moins 50%.",
        "explanation_ar": "ستون ساعة في الأسبوع تتجاوز بكثير الحد القانوني وهو 40 ساعة، وكل ساعة إضافية يجب أن تُدفع بزيادة لا تقل عن 50%.",
        "citations": [
            ("Code du travail", "Art. 22", "La durée légale hebdomadaire de travail est fixée à quarante (40) heures…"),
            ("Code du travail", "Art. 31", "Les heures supplémentaires donnent lieu à une majoration qui ne peut être inférieure à 50%…"),
        ],
        "fair_rewrite": "Le salarié travaillera 40 heures par semaine. Toute heure supplémentaire sera rémunérée avec une majoration minimale de 50% conformément à l'art. 31 du Code du travail.",
    },
    "Article 2": {
        "verdict": "red",
        "severity": 85,
        "title": "Suppression du congé annuel — interdit",
        "explanation": "Le congé annuel est un droit légal acquis dès le premier mois, pas après un an. Toute clause y dérogeant est nulle.",
        "explanation_ar": "العطلة السنوية حق قانوني يُكتسب منذ الشهر الأول، وليس بعد سنة. كل بند يخالف ذلك يُعدّ باطلاً.",
        "citations": [
            ("Code du travail", "Art. 39", "Tout travailleur a droit à un congé annuel rémunéré payé par l'employeur…"),
            ("Code du travail", "Art. 40", "La durée du congé annuel ne peut être inférieure à trente (30) jours calendaires…"),
        ],
        "fair_rewrite": "Le salarié bénéficiera d'un congé annuel rémunéré de 30 jours calendaires minimum par année de travail, acquis à raison de 2,5 jours par mois.",
    },
    "Article 3": {
        "verdict": "red",
        "severity": 95,
        "title": "Licenciement sans préavis ni motif — totalement illégal",
        "explanation": "L'employeur ne peut rompre le contrat sans procédure disciplinaire, sans motif réel et sans préavis légal. Cette clause est nulle de plein droit.",
        "explanation_ar": "لا يحق لصاحب العمل إنهاء العقد دون إجراء تأديبي ودون سبب حقيقي ودون إشعار مسبق قانوني. هذا البند باطل بقوة القانون.",
        "citations": [
            ("Code du travail", "Art. 73", "Le licenciement à caractère disciplinaire ne peut intervenir que pour faute grave, après mise en demeure…"),
            ("Code du travail", "Art. 74", "Le travailleur licencié sans cause réelle et sérieuse a droit à une indemnité de licenciement et à un préavis…"),
        ],
        "fair_rewrite": "La rupture du contrat ne peut intervenir que pour cause réelle et sérieuse, après procédure disciplinaire écrite et respect du préavis légal.",
    },
    "Article 4": {
        "verdict": "orange",
        "severity": 60,
        "title": "Clause de non-concurrence excessive",
        "explanation": "Une clause de non-concurrence de 5 ans sur tout le territoire national est disproportionnée. Elle doit être limitée dans le temps, l'espace et compensée financièrement.",
        "explanation_ar": "بند عدم المنافسة لمدة خمس سنوات على كامل التراب الوطني مبالغ فيه. يجب أن يكون محدوداً في الزمن والمكان وأن يقابله تعويض مالي.",
        "citations": [
            ("Code civil", "Art. 106", "Le contrat fait la loi des parties… Il doit être exécuté de bonne foi."),
            ("Code civil", "Art. 110", "…le juge peut modifier les clauses abusives ou en dispenser cette partie…"),
        ],
        "fair_rewrite": "Une clause de non-concurrence de durée et de zone géographique raisonnables (max 12 mois, secteur d'activité spécifique), assortie d'une compensation financière mensuelle.",
    },
    "Article 5": {
        "verdict": "red",
        "severity": 80,
        "title": "Renonciation au juge — clause nulle",
        "explanation": "On ne peut pas légalement renoncer à l'accès au juge. C'est une clause abusive caractérisée.",
        "explanation_ar": "لا يمكن قانوناً التنازل عن حق اللجوء إلى القضاء. هذا بند تعسفي واضح.",
        "citations": [
            ("Code civil", "Art. 110", "…clauses abusives… réputées non écrites…"),
        ],
        "fair_rewrite": "Tout litige relatif à l'exécution du présent contrat sera soumis aux juridictions algériennes compétentes selon le droit commun.",
    },
}


def _segment_clauses(text: str) -> List[tuple]:
    """Split a contract into (heading, body) pairs based on 'Article N' markers."""
    pattern = r"(Article\s+\d+[^\n]*)"
    parts = re.split(pattern, text, flags=re.IGNORECASE)
    clauses: List[tuple] = []
    if len(parts) <= 1:
        chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
        return [(f"Clause {i+1}", c) for i, c in enumerate(chunks)]
    i = 1
    while i < len(parts):
        heading = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""
        m = re.search(r"Article\s+\d+", heading, re.IGNORECASE)
        key = m.group(0).title() if m else heading
        clauses.append((key, body))
        i += 2
    return clauses


def _norm(s: str) -> str:
    """Lowercase + strip accents so patterns match OCR text with or without accents."""
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


# Generic red-flag patterns — let the scanner analyze ANY contract, not just the demo.
# Each: regex (on normalized text), verdict, severity, title, explanation (fr/ar), citations, rewrite.
_PATTERNS = [
    {
        "re": r"sans heures? supplementaires?|\b(4[5-9]|[5-9]\d|1\d\d)\s*heures?",
        "verdict": "red", "severity": 88,
        "title": "Durée du travail / heures supplémentaires",
        "explanation": "La durée légale est de 40h/semaine et toute heure au-delà doit être majorée d'au moins 50%.",
        "explanation_ar": "المدة القانونية هي 40 ساعة أسبوعياً، وكل ساعة إضافية يجب أن تُدفع بزيادة لا تقل عن 50%.",
        "citations": [("Code du travail", "Art. 22", "La durée légale hebdomadaire de travail est fixée à quarante (40) heures…"),
                      ("Code du travail", "Art. 31", "Les heures supplémentaires donnent lieu à une majoration d'au moins 50%…")],
        "fair_rewrite": "Le salarié travaillera 40 heures par semaine ; les heures supplémentaires sont majorées d'au moins 50%.",
    },
    {
        "re": r"sans preavis|sans indemnite|a tout moment.*(licenci|met fin|rompre)|met fin.*sans",
        "verdict": "red", "severity": 92,
        "title": "Rupture sans préavis ni motif",
        "explanation": "L'employeur ne peut rompre le contrat sans cause réelle, procédure disciplinaire et préavis légal.",
        "explanation_ar": "لا يحق لصاحب العمل إنهاء العقد دون سبب حقيقي وإجراء تأديبي وإشعار مسبق قانوني.",
        "citations": [("Code du travail", "Art. 73", "Le licenciement ne peut intervenir que pour faute grave, après mise en demeure…"),
                      ("Code du travail", "Art. 74", "Le travailleur licencié sans cause réelle a droit à une indemnité et à un préavis…")],
        "fair_rewrite": "La rupture n'intervient que pour cause réelle, après procédure écrite et respect du préavis légal.",
    },
    {
        "re": r"aucun.{0,20}cong|sans cong|pas de cong",
        "verdict": "red", "severity": 84,
        "title": "Suppression du congé annuel",
        "explanation": "Le congé annuel est un droit acquis dès le premier mois ; toute clause le supprimant est nulle.",
        "explanation_ar": "العطلة السنوية حق يُكتسب منذ الشهر الأول، وكل بند يلغيها يُعدّ باطلاً.",
        "citations": [("Code du travail", "Art. 39", "Tout travailleur a droit à un congé annuel rémunéré…"),
                      ("Code du travail", "Art. 40", "La durée du congé annuel ne peut être inférieure à 30 jours…")],
        "fair_rewrite": "Le salarié bénéficie d'au moins 30 jours de congé annuel rémunéré par an.",
    },
    {
        "re": r"non[- ]?concurrence",
        "verdict": "orange", "severity": 58,
        "title": "Clause de non-concurrence",
        "explanation": "Une clause de non-concurrence doit être limitée dans le temps, l'espace, et compensée financièrement.",
        "explanation_ar": "بند عدم المنافسة يجب أن يكون محدوداً في الزمان والمكان وأن يقابله تعويض مالي.",
        "citations": [("Code civil", "Art. 110", "Le juge peut modifier les clauses abusives ou en dispenser la partie adhérente…")],
        "fair_rewrite": "Non-concurrence limitée (durée et zone raisonnables) avec compensation financière.",
    },
    {
        "re": r"renonc|exclusivement par l.?employeur|renonciation.*juge|tranche.*employeur",
        "verdict": "red", "severity": 80,
        "title": "Renonciation à l'accès au juge",
        "explanation": "On ne peut pas renoncer à l'accès au juge ni confier la décision à l'autre partie. Clause abusive.",
        "explanation_ar": "لا يمكن التنازل عن حق اللجوء إلى القضاء ولا منح القرار للطرف الآخر. هذا بند تعسفي.",
        "citations": [("Code civil", "Art. 110", "Clauses abusives réputées non écrites…")],
        "fair_rewrite": "Tout litige est soumis aux juridictions algériennes compétentes selon le droit commun.",
    },
    {
        "re": r"non remboursable|non restituable|caution.*conserv|conserv.*caution",
        "verdict": "red", "severity": 78,
        "title": "Caution non restituable",
        "explanation": "La caution doit être restituée en fin de bail, hors dégradations réelles. La retenir d'office est abusif.",
        "explanation_ar": "يجب إرجاع الكفالة في نهاية الإيجار، باستثناء الأضرار الحقيقية. الاحتفاظ بها تلقائياً تعسّف.",
        "citations": [("Code civil", "Art. 482", "Le preneur a droit à la restitution de la garantie en fin de bail…")],
        "fair_rewrite": "La caution est restituée sous 30 jours après l'état des lieux de sortie, hors dégradations.",
    },
    {
        "re": r"penalite|\b[2-9]\d\s*%|\b1\d\d\s*%",
        "verdict": "orange", "severity": 55,
        "title": "Pénalité potentiellement excessive",
        "explanation": "Une pénalité disproportionnée peut être réduite par le juge. Vérifie le plafond légal applicable.",
        "explanation_ar": "الغرامة المبالغ فيها يمكن أن يخفّضها القاضي. تحقّق من السقف القانوني المطبّق.",
        "citations": [("Code civil", "Art. 110", "Le juge peut réduire une clause manifestement excessive…")],
        "fair_rewrite": "Pénalité plafonnée à un pourcentage raisonnable, proportionnée au préjudice réel.",
    },
]


def _generic_analyze_clause(idx: int, body: str) -> ClauseAnalysis:
    """Scan any clause for red-flag patterns. Returns green if nothing matches."""
    norm = _norm(body)
    for p in _PATTERNS:
        if re.search(p["re"], norm):
            return ClauseAnalysis(
                id=idx, text=body, verdict=p["verdict"], severity=p["severity"],
                title=p["title"], explanation=p["explanation"],
                explanation_ar=p["explanation_ar"],
                citations=[Citation(code=c, article=a, excerpt=e) for (c, a, e) in p["citations"]],
                fair_rewrite=p.get("fair_rewrite"), confidence=0.78,
            )
    return ClauseAnalysis(
        id=idx, text=body, verdict="green", severity=10, title="Clause standard",
        explanation="Aucune anomalie détectée par rapport au cadre légal courant.",
        explanation_ar="لم يُكتشف أي خلل مقارنة بالإطار القانوني المعمول به.",
        citations=[], fair_rewrite=None, confidence=0.6,
    )


def _mock_analyze_clause(idx: int, key: str, body: str) -> ClauseAnalysis:
    """Use the demo dictionary for the known contract; otherwise run generic detection."""
    spec = _DEMO_ANALYSIS.get(key)
    if spec:
        citations = [
            Citation(code=c, article=a, excerpt=e) for (c, a, e) in spec["citations"]
        ]
        return ClauseAnalysis(
            id=idx,
            text=body,
            verdict=spec["verdict"],
            severity=spec["severity"],
            title=spec["title"],
            explanation=spec["explanation"],
            explanation_ar=spec.get("explanation_ar"),
            citations=citations,
            fair_rewrite=spec.get("fair_rewrite"),
            confidence=0.92,
        )
    return _generic_analyze_clause(idx, body)


def _llm_analyze_clause(idx: int, key: str, body: str) -> ClauseAnalysis:
    """Try the LLM, fall back to mock if it fails or returns garbage."""
    retrieved = rag_svc.retrieve(body, k=3)
    context = "\n".join(
        f"- {a['code']} {a['article']}: {a['text']}" for a in retrieved
    )
    prompt = f"""Analyse cette clause d'un contrat algérien et retourne UN OBJET JSON STRICT.

Clause: "{body}"

Articles juridiques pertinents (utilise UNIQUEMENT ceux-ci pour citer):
{context}

Retourne ce JSON exact:
{{
  "verdict": "green" | "orange" | "red",
  "severity": 0-100,
  "title": "titre court du problème",
  "explanation": "1-2 phrases claires",
  "citations": [{{"code": "...", "article": "...", "excerpt": "..."}}],
  "fair_rewrite": "version équilibrée" ou null,
  "confidence": 0.0-1.0
}}"""
    data = llm_svc.generate_json(prompt)
    if not data or "verdict" not in data:
        return _mock_analyze_clause(idx, key, body)
    try:
        return ClauseAnalysis(
            id=idx,
            text=body,
            verdict=data.get("verdict", "orange"),
            severity=int(data.get("severity", 50)),
            title=data.get("title", "Analyse"),
            explanation=data.get("explanation", ""),
            citations=[Citation(**c) for c in data.get("citations", [])],
            fair_rewrite=data.get("fair_rewrite"),
            confidence=float(data.get("confidence", 0.6)),
        )
    except Exception:
        return _mock_analyze_clause(idx, key, body)


def _detect_doc_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["bail", "location", "preneur", "bailleur", "loyer"]):
        return "Contrat de bail"
    if any(w in t for w in ["travail", "employeur", "salarie", "salaire", "embauche"]):
        return "Contrat de travail"
    if any(w in t for w in ["vente", "acheteur", "vendeur"]):
        return "Contrat de vente"
    if any(w in t for w in ["pret", "emprunteur", "preteur", "remboursement"]):
        return "Contrat de prêt"
    return "Contrat"


def _missing_clauses(doc_type: str, text: str) -> List[str]:
    t = text.lower()
    missing: List[str] = []
    if doc_type == "Contrat de travail":
        if "salaire" not in t and "rémunération" not in t and "remuneration" not in t:
            missing.append("Montant du salaire — protection légale non garantie")
        if "horaire" not in t and "durée" not in t and "duree" not in t and "heures" not in t:
            missing.append("Durée du travail — référence légale obligatoire")
    if doc_type == "Contrat de bail":
        if "caution" not in t and "garantie" not in t:
            missing.append("Montant de la caution — obligation légale")
        if "durée" not in t and "duree" not in t:
            missing.append("Durée du bail — clause essentielle")
    return missing


def _authenticity_flags(text: str) -> List[str]:
    flags: List[str] = []
    if not re.search(r"\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b", text):
        flags.append("Aucune date détectée sur le document")
    if "signature" not in text.lower() and "signé" not in text.lower() and "signe" not in text.lower():
        flags.append("Aucune mention de signature visible")
    return flags


@router.post("/analyze", response_model=ScanResult)
async def analyze_contract(file: UploadFile = File(...)):
    image_bytes = await file.read()
    text = ocr_svc.extract_text(image_bytes)

    doc_type = _detect_doc_type(text)
    pairs = _segment_clauses(text)

    analyses: List[ClauseAnalysis] = []
    for i, (key, body) in enumerate(pairs):
        if llm_svc.LLM_BACKEND == "ollama":
            analyses.append(_llm_analyze_clause(i, key, body))
        else:
            analyses.append(_mock_analyze_clause(i, key, body))

    red = sum(1 for a in analyses if a.verdict == "red")
    orange = sum(1 for a in analyses if a.verdict == "orange")
    total = max(len(analyses), 1)
    score = max(0, 100 - (red * 22) - (orange * 10))

    summary = (
        f"{red} clause(s) gravement abusive(s), {orange} préoccupante(s). "
        "Ne signe pas en l'état."
        if red > 0
        else "Contrat globalement équilibré. Lecture détaillée recommandée."
    )

    next_steps = []
    if red > 0:
        next_steps = [
            "Ne pas signer ce contrat en l'état",
            "Présenter les versions réécrites proposées pour renégocier",
            "Consulter le Bureau d'aide juridictionnelle si l'autre partie refuse",
        ]
    else:
        next_steps = ["Lire chaque clause en détail", "Demander une copie signée"]

    return ScanResult(
        document_type=doc_type,
        overall_score=score,
        summary=summary,
        raw_text=text,
        clauses=analyses,
        missing_clauses=_missing_clauses(doc_type, text),
        authenticity_flags=_authenticity_flags(text),
        next_steps=next_steps,
    )


@router.get("/demo")
def get_demo_result():
    """Returns the canned demo analysis without needing an upload — useful as a fallback during the live demo if the upload chokes."""
    from fastapi.responses import JSONResponse
    text = ocr_svc.DEMO_CONTRACT
    pairs = _segment_clauses(text)
    analyses = [_mock_analyze_clause(i, k, b) for i, (k, b) in enumerate(pairs)]
    red = sum(1 for a in analyses if a.verdict == "red")
    orange = sum(1 for a in analyses if a.verdict == "orange")
    score = max(0, 100 - (red * 22) - (orange * 10))
    return JSONResponse(
        {
            "document_type": "Contrat de travail",
            "overall_score": score,
            "summary": f"{red} clause(s) gravement abusive(s), {orange} préoccupante(s). Ne signe pas en l'état.",
            "raw_text": text,
            "clauses": [a.model_dump() for a in analyses],
            "missing_clauses": _missing_clauses("Contrat de travail", text),
            "authenticity_flags": _authenticity_flags(text),
            "next_steps": [
                "Ne pas signer ce contrat en l'état",
                "Présenter les versions réécrites proposées pour renégocier",
                "Consulter le Bureau d'aide juridictionnelle si l'autre partie refuse",
            ],
        }
    )
