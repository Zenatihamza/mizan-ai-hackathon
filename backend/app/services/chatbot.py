"""Legal assistant answer generation.

Grounded in the legal corpus (RAG). Works in two modes:
- mock  : intent-matched answers with real article citations + Arabic for voice.
- ollama: real LLM generation over retrieved context.

Always returns: {"content": fr, "content_ar": ar|None, "citations": [...]}
"""
import json
from pathlib import Path
from typing import List, Dict, Optional

from app.services import rag as rag_svc
from app.services import llm as llm_svc

_PROCS_PATH = Path(__file__).parent.parent / "data" / "procedures.json"


def _procedures() -> List[dict]:
    with open(_PROCS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["procedures"]


# Intent templates: keyword -> curated bilingual answer + matching procedure id
_INTENTS = [
    {
        "keys": ["caution", "garantie", "propriétaire", "proprietaire", "bail", "loyer", "louer"],
        "fr": "Si ton propriétaire refuse de te rendre la caution, la loi est de ton côté : il doit la restituer à la fin du bail, déduction faite des seules dégradations réelles. Envoie une mise en demeure écrite, puis saisis la maison de justice (médiation gratuite) avant le tribunal de proximité.",
        "ar": "إذا رفض المالك إرجاع الكفالة، فالقانون في صالحك: يجب عليه إرجاعها عند نهاية عقد الإيجار، مع خصم الأضرار الحقيقية فقط. أرسل إعذاراً كتابياً، ثم توجّه إلى دار العدالة للوساطة المجانية قبل اللجوء إلى محكمة القرب.",
        "proc": "litige-bail",
    },
    {
        "keys": ["heures", "supplémentaires", "supplementaires", "salaire", "patron", "employeur", "travail", "payer"],
        "fr": "La durée légale est de 40 heures par semaine, et toute heure supplémentaire doit être majorée d'au moins 50%. Ton employeur ne peut pas y renoncer « par habitude ». Garde tes bulletins de paie et dépose une plainte à l'Inspection du travail — c'est gratuit et obligatoire avant le tribunal.",
        "ar": "المدة القانونية للعمل هي 40 ساعة في الأسبوع، وكل ساعة إضافية يجب أن تُدفع بزيادة لا تقل عن 50%. لا يحق لصاحب العمل التنازل عن ذلك. احتفظ بكشوف الراتب وقدّم شكوى لدى مفتشية العمل، فهي مجانية وإلزامية قبل المحكمة.",
        "proc": "litige-travail",
    },
    {
        "keys": ["licenciement", "licencié", "licencie", "renvoyé", "renvoye", "préavis", "preavis", "viré", "vire"],
        "fr": "Un licenciement sans cause réelle, sans procédure disciplinaire et sans préavis est illégal. Avec ton ancienneté, tu peux exiger ta réintégration ou une indemnité. Saisis l'Inspection du travail rapidement, puis le tribunal section sociale si besoin.",
        "ar": "الطرد دون سبب حقيقي ودون إجراء تأديبي ودون إشعار مسبق غير قانوني. بحكم أقدميتك، يمكنك المطالبة بإعادة الإدماج أو بتعويض. توجّه بسرعة إلى مفتشية العمل، ثم إلى المحكمة في القسم الاجتماعي عند الحاجة.",
        "proc": "litige-travail",
    },
    {
        "keys": ["remboursement", "rembourser", "magasin", "vendeur", "produit", "défectueux", "defectueux", "achat", "commerçant", "commercant"],
        "fr": "Une clause « pas de remboursement » est nulle quand le produit est défectueux. Tu as droit au remboursement ou au remplacement. Mets le commerçant en demeure par écrit, puis saisis la Direction du Commerce (DCP) ou une association de consommateurs.",
        "ar": "شرط «لا استرجاع للمال» باطل عندما يكون المنتوج معيباً. لك الحق في استرجاع المبلغ أو استبدال المنتوج. وجّه إعذاراً كتابياً للتاجر، ثم توجّه إلى مديرية التجارة أو إلى جمعية حماية المستهلك.",
        "proc": "refus-remboursement",
    },
    {
        "keys": ["avocat", "gratuit", "aide", "juridictionnelle", "argent", "pauvre"],
        "fr": "Si tes revenus sont modestes, tu as droit à un avocat gratuit via l'aide juridictionnelle. Retire le formulaire au Bureau d'aide juridictionnelle de la Cour, joins tes justificatifs de revenus, et un avocat te sera désigné.",
        "ar": "إذا كان دخلك محدوداً، لك الحق في محامٍ مجاني عبر المساعدة القضائية. اسحب الاستمارة من مكتب المساعدة القضائية بالمجلس القضائي، وأرفق ما يثبت دخلك، وسيُعيَّن لك محامٍ.",
        "proc": "aide-juridictionnelle",
    },
]

_DISCLAIMER = (
    " \n\n— Cette information est générale et ne remplace pas la consultation d'un avocat."
)
_DISCLAIMER_AR = " \n\nهذه معلومة عامة ولا تغني عن استشارة محامٍ."


def _match_intent(message: str) -> Optional[dict]:
    m = message.lower()
    best, best_score = None, 0
    for intent in _INTENTS:
        score = sum(1 for k in intent["keys"] if k in m)
        if score > best_score:
            best, best_score = intent, score
    return best if best_score > 0 else None


def _citations_for(query: str, limit: int = 2) -> List[Dict]:
    arts = rag_svc.retrieve(query, k=limit)
    return [
        {"code": a["code"], "article": a["article"], "excerpt": a["text"][:160]}
        for a in arts
    ]


def _mock_answer(message: str) -> Dict:
    intent = _match_intent(message)
    citations = _citations_for(message, limit=2)
    if intent:
        proc = next((p for p in _procedures() if p["id"] == intent["proc"]), None)
        fr = intent["fr"]
        ar = intent["ar"]
        if proc:
            fr += f"\n\n📍 Où aller : {proc['where']} · Délai : {proc['delay']} · Coût : {proc['cost']}."
        return {
            "content": fr + _DISCLAIMER,
            "content_ar": ar + _DISCLAIMER_AR,
            "citations": citations,
        }
    # Generic grounded fallback
    if citations:
        joined = " ; ".join(f"{c['code']} {c['article']}" for c in citations)
        fr = (
            "Voici ce que dit la loi algérienne sur ta situation. "
            f"Les textes pertinents sont : {joined}. "
            "Décris-moi ton problème plus précisément (bail, travail, achat, licenciement…) "
            "et je te donnerai la procédure exacte à suivre."
        )
    else:
        fr = (
            "Je peux t'aider sur le bail, le travail, la consommation, le licenciement "
            "ou l'accès à un avocat. Décris ta situation en une phrase et je t'explique "
            "tes droits et les démarches."
        )
    return {
        "content": fr + _DISCLAIMER,
        "content_ar": "أخبرني بمشكلتك بدقة (إيجار، عمل، شراء، طرد…) وسأشرح لك حقوقك والإجراءات."
        + _DISCLAIMER_AR,
        "citations": citations,
    }


def _ollama_answer(message: str, history: List[Dict]) -> Optional[Dict]:
    retrieved = rag_svc.retrieve(message, k=3)
    context = "\n".join(f"- {a['code']} {a['article']}: {a['text']}" for a in retrieved)
    convo = "\n".join(f"{h['role']}: {h['content']}" for h in history[-6:])
    prompt = f"""Tu es un assistant juridique pour les citoyens algériens.
Réponds en français clair et bref. Cite UNIQUEMENT les articles ci-dessous.
Termine en rappelant que ça ne remplace pas un avocat.

Articles de loi disponibles:
{context}

Historique:
{convo}

Question: {message}

Réponse:"""
    text = llm_svc.generate(prompt)
    if not text:
        return None
    return {
        "content": text.strip(),
        "content_ar": None,
        "citations": [
            {"code": a["code"], "article": a["article"], "excerpt": a["text"][:160]}
            for a in retrieved
        ],
    }


def answer(message: str, history: List[Dict]) -> Dict:
    if llm_svc.LLM_BACKEND == "ollama":
        result = _ollama_answer(message, history)
        if result:
            return result
    return _mock_answer(message)


def make_title(first_message: str) -> str:
    t = first_message.strip().replace("\n", " ")
    return (t[:40] + "…") if len(t) > 40 else (t or "Nouvelle conversation")
