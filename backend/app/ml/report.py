"""Generate performance visuals for the trained classifier.

Run: python -m app.ml.report
Outputs (in app/ml/reports/):
  - confusion_matrix.png
  - f1_per_class.png
  - metrics.csv
"""
import csv
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import confusion_matrix, f1_score, classification_report

from app.ml.train import build_pipeline, load_data

OUT = Path(__file__).parent / "reports"
OUT.mkdir(exist_ok=True)

GOLD = "#cf9a4e"
INK = "#2c1c14"


def main():
    texts, labels = load_data()
    classes = sorted(set(labels))

    X_tr, X_te, y_tr, y_te = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )
    pipe = build_pipeline().fit(X_tr, y_tr)
    y_pred = pipe.predict(X_te)

    holdout = (np.array(y_pred) == np.array(y_te)).mean()
    cv = cross_val_score(build_pipeline(), texts, labels, cv=5).mean()

    # --- Confusion matrix ---
    cm = confusion_matrix(y_te, y_pred, labels=classes)
    fig, ax = plt.subplots(figsize=(8.5, 7.5))
    im = ax.imshow(cm, cmap="YlOrBr")
    ax.set_xticks(range(len(classes)))
    ax.set_xticklabels(classes, rotation=45, ha="right")
    ax.set_yticks(range(len(classes)))
    ax.set_yticklabels(classes)
    for i in range(len(classes)):
        for j in range(len(classes)):
            ax.text(j, i, cm[i, j], ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() / 2 else INK, fontsize=10)
    ax.set_xlabel("Classe prédite")
    ax.set_ylabel("Classe réelle")
    ax.set_title(f"Matrice de confusion — JusticIA\nhold-out 25%  ·  accuracy {holdout:.0%}", color=INK)
    fig.colorbar(im, fraction=0.046, pad=0.04)
    fig.tight_layout()
    fig.savefig(OUT / "confusion_matrix.png", dpi=150)

    # --- F1 per class ---
    f1s = f1_score(y_te, y_pred, labels=classes, average=None, zero_division=0)
    order = np.argsort(f1s)
    fig2, ax2 = plt.subplots(figsize=(8.5, 5.5))
    ax2.barh([classes[i] for i in order], [f1s[i] for i in order], color=GOLD)
    ax2.set_xlim(0, 1.05)
    ax2.set_xlabel("F1-score")
    ax2.set_title(
        f"F1-score par domaine juridique — JusticIA\n"
        f"validation croisée 5-fold : {cv:.0%}",
        color=INK,
    )
    for i, j in enumerate(order):
        ax2.text(f1s[j] + 0.01, i, f"{f1s[j]:.2f}", va="center", fontsize=9)
    fig2.tight_layout()
    fig2.savefig(OUT / "f1_per_class.png", dpi=150)

    # --- CSV ---
    rep = classification_report(y_te, y_pred, labels=classes, output_dict=True, zero_division=0)
    with open(OUT / "metrics.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["classe", "precision", "recall", "f1", "support"])
        for c in classes:
            r = rep[c]
            w.writerow([c, f"{r['precision']:.2f}", f"{r['recall']:.2f}",
                        f"{r['f1-score']:.2f}", int(r["support"])])
        w.writerow(["accuracy_holdout", "", "", f"{holdout:.3f}", len(y_te)])
        w.writerow(["accuracy_crossval", "", "", f"{cv:.3f}", len(texts)])

    print(f"Hold-out accuracy: {holdout:.1%}  |  Cross-val: {cv:.1%}")
    print(f"Saved: {OUT}")


if __name__ == "__main__":
    main()
