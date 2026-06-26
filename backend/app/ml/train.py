"""Train the legal-question intent classifier.

Real supervised ML: TF-IDF features (word + character n-grams, so it handles
French, transliterated Darija and Arabic script) + Logistic Regression.

Run:  python -m app.ml.train
Outputs: app/ml/model.joblib  and prints accuracy (hold-out + cross-validation).
"""
import json
from pathlib import Path

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report
import joblib

HERE = Path(__file__).parent
DATA = HERE.parent / "data" / "legal_dataset.json"
MODEL_PATH = HERE / "model.joblib"


def load_data():
    with open(DATA, "r", encoding="utf-8") as f:
        data = json.load(f)
    texts = [s["text"] for s in data["samples"]]
    labels = [s["label"] for s in data["samples"]]
    return texts, labels


def build_pipeline() -> Pipeline:
    # Word n-grams capture FR/darija tokens; char n-grams capture Arabic script
    # and spelling variants (robust to transliteration).
    features = FeatureUnion([
        ("word", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), sublinear_tf=True, min_df=1)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), sublinear_tf=True, min_df=1)),
    ])
    clf = LogisticRegression(max_iter=2000, C=4.0, class_weight="balanced")
    return Pipeline([("features", features), ("clf", clf)])


def main():
    texts, labels = load_data()
    print(f"Dataset: {len(texts)} exemples, {len(set(labels))} classes")

    pipe = build_pipeline()

    # Honest evaluation: stratified hold-out + cross-validation
    X_tr, X_te, y_tr, y_te = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )
    pipe.fit(X_tr, y_tr)
    acc = pipe.score(X_te, y_te)
    print(f"\nAccuracy (hold-out 25%): {acc:.1%}")

    cv = cross_val_score(build_pipeline(), texts, labels, cv=5)
    print(f"Accuracy (cross-val 5-fold): {cv.mean():.1%} (+/- {cv.std():.1%})")

    print("\nRapport détaillé (hold-out):")
    print(classification_report(y_te, pipe.predict(X_te), zero_division=0))

    # Final model trained on ALL data, then saved
    final = build_pipeline()
    final.fit(texts, labels)
    joblib.dump(final, MODEL_PATH)
    print(f"Modèle entraîné et sauvegardé -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
