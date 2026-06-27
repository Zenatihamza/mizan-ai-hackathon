"""Render the JusticIA Business Model Canvas as a high-res 16:9 PNG (Canva-ready)."""
import textwrap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ESPRESSO = "#2C1C14"; MAROON = "#7A2E2A"; COPPER = "#C8794F"
GOLD = "#8A5A1E"; SAND = "#F5ECE2"; BORDER = "#D8C4B4"; WHITE = "#FFFFFF"

W, H = 13.333, 7.5
fig = plt.figure(figsize=(W, H), dpi=200)
ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.axis("off")
ax.add_patch(plt.Rectangle((0, 0), W, H, color=WHITE, zorder=0))


def top(y):
    return H - y


ax.text(0.4, top(0.34), "Business Model Canvas", fontsize=30, fontweight="bold",
        color=ESPRESSO, va="top", family="DejaVu Sans")
ax.text(0.4, top(0.98),
        "JusticIA   ·   l'accès au droit algérien, en français et en arabe   ·   Hackathon Nous — Challenge 1",
        fontsize=12.5, color=MAROON, va="top", family="DejaVu Sans")


def block(x, y, w, h, title, bullets, fill, tcol, bcol, wrap=29):
    ax.add_patch(FancyBboxPatch((x, top(y) - h), w, h,
                 boxstyle="round,pad=0,rounding_size=0.09",
                 facecolor=fill, edgecolor=BORDER, linewidth=1.0))
    ax.text(x + 0.13, top(y + 0.11), title.upper(), fontsize=11, fontweight="bold",
            color=tcol, va="top", family="DejaVu Sans")
    yy = y + 0.47
    for b in bullets:
        lines = textwrap.wrap(b, width=wrap) or [""]
        ax.text(x + 0.13, top(yy), "•  " + lines[0], fontsize=10, color=bcol,
                va="top", family="DejaVu Sans")
        yy += 0.245
        for cont in lines[1:]:
            ax.text(x + 0.13, top(yy), "   " + cont, fontsize=10, color=bcol,
                    va="top", family="DejaVu Sans")
            yy += 0.245
        yy += 0.05


cw, gap = 2.4106, 0.12
x = [0.4 + i * (cw + gap) for i in range(5)]
ty, th = 1.4, 4.16
hh = (th - 0.12) / 2
by = ty + th + 0.12
bh = 7.2 - by

block(x[0], ty, cw, th, "Partenaires clés",
      ["Ministère de la Justice, Dzair Digital", "Avocats et aide juridictionnelle",
       "Associations (APOCE, consommateurs)", "Universités et facultés de droit",
       "Maisons de justice, mairies"], SAND, MAROON, ESPRESSO)
block(x[1], ty, cw, hh, "Activités clés",
      ["Développement de la plateforme", "Curation du corpus juridique",
       "Entraînement du modèle ML"], SAND, MAROON, ESPRESSO)
block(x[1], ty + hh + 0.12, cw, hh, "Ressources clés",
      ["Corpus de lois algériennes", "Modèle ML entraîné",
       "Équipe tech et juridique"], SAND, MAROON, ESPRESSO)
block(x[2], ty, cw, th, "Proposition de valeur",
      ["Comprendre ses droits en FR et arabe", "Réponses ancrées dans la loi, sans invention",
       "Scanner de clauses abusives", "Mode urgence et démarches par wilaya",
       "Gratuit, accessible, sans avocat"], COPPER, WHITE, WHITE)
block(x[3], ty, cw, hh, "Relations clients",
      ["Assistant en libre-service", "Gamification (simulateur)",
       "Escalade vers de vrais avocats"], SAND, MAROON, ESPRESSO)
block(x[3], ty + hh + 0.12, cw, hh, "Canaux",
      ["Application web puis mobile", "Universités, réseaux sociaux",
       "Guichets publics partenaires"], SAND, MAROON, ESPRESSO)
block(x[4], ty, cw, th, "Segments de clientèle",
      ["Citoyens, populations vulnérables", "Ruraux, faibles revenus",
       "Personnes peu alphabétisées", "Étudiants et universités",
       "Associations et ONG"], SAND, MAROON, ESPRESSO)
block(0.4, by, 3 * cw + 2 * gap, bh, "Structure de coûts",
      ["Développement et hébergement", "Juristes pour la curation",
       "Marketing et partenariats", "Coût léger : CPU, open-source"],
      SAND, MAROON, ESPRESSO, wrap=70)
block(x[3], by, 2 * cw + gap, bh, "Sources de revenus",
      ["Freemium, gratuit pour les citoyens", "B2B : cabinets et associations",
       "Subventions et partenariats publics", "Premium : mise en relation, rapports PDF"],
      SAND, GOLD, ESPRESSO, wrap=46)

fig.savefig("C:/Users/Hello/Desktop/mizan-ai/pitch/JusticIA_BMC.png", dpi=200)
print("saved JusticIA_BMC.png")
