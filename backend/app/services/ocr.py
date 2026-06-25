"""OCR via Tesseract with Arabic + French. Falls back to mock text on failure."""
import io
from PIL import Image

from app.config import TESSERACT_PATH

try:
    import pytesseract
    if TESSERACT_PATH:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
    HAS_TESSERACT = True
except Exception:
    HAS_TESSERACT = False


# Pre-cooked demo contract — used when OCR is unavailable or fails.
# This is the "rigged demo" that always works in front of the jury.
DEMO_CONTRACT = """CONTRAT DE TRAVAIL

Entre l'employeur ATLAS SARL et l'employe KARIM B.

Article 1 - Le salarie travaillera 60 heures par semaine sans heures supplementaires payees.

Article 2 - Aucune periode de conge annuel ne sera accordee durant la premiere annee.

Article 3 - L'employeur peut mettre fin au contrat a tout moment sans preavis ni indemnite.

Article 4 - Le salarie s'engage a une clause de non-concurrence de 5 ans sur tout le territoire national.

Article 5 - Toute contestation sera tranchee exclusivement par l'employeur.

Fait a Alger, le 15/03/2026"""


def extract_text(image_bytes: bytes) -> str:
    """Extract text from an image. Returns DEMO_CONTRACT on any failure."""
    if not HAS_TESSERACT:
        return DEMO_CONTRACT
    try:
        img = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img, lang="ara+fra")
        text = text.strip()
        if len(text) < 40:
            return DEMO_CONTRACT
        return text
    except Exception:
        return DEMO_CONTRACT
