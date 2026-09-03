import pandas as pd
import json
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score

# Ensure directories exist
os.makedirs("models", exist_ok=True)

# Load data
df = pd.read_csv("datasets/classification_data.csv")
X = df["text"]
y = df["event_type"]

# Stratified split to ensure all classes are represented in train and test if possible
# But since our dataset is very small, stratify might fail if some classes have only 1 sample.
# We will use standard split or stratify only if min class count > 1
try:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
except ValueError:
    print("Warning: Dataset too small for stratified split. Using random split.")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Build pipeline
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("clf", LogisticRegression(class_weight="balanced", random_state=42))
])

# Train
pipeline.fit(X_train, y_train)

# Evaluate
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

print("Classification Metrics:")
print(f"Accuracy: {acc:.2f}")
print(f"Precision: {prec:.2f}")
print(f"Recall: {rec:.2f}")
print(f"F1-Score: {f1:.2f}")

metrics = {
    "model_version": "weather-classifier-v1",
    "dataset_size": len(df),
    "accuracy": acc,
    "precision": prec,
    "recall": rec,
    "f1_score": f1,
    "classification_report": report_dict
}

with open("models/classifier_metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

# Save model
joblib.dump(pipeline, "models/classifier_v1.joblib")
print("Model saved to models/classifier_v1.joblib")
