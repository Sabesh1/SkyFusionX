import pandas as pd
import json
import os
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score

os.makedirs("models", exist_ok=True)

df = pd.read_csv("datasets/trust_data.csv")

# We want to map reliable = 1, suspicious = 0
y = df["label"].map({"reliable": 1, "suspicious": 0})
X = df[["text_length", "has_media", "source_type", "metadata_completeness"]]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['text_length', 'metadata_completeness']),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['source_type', 'has_media'])
    ])

pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(class_weight="balanced", random_state=42))
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

report_dict = classification_report(y_test, y_pred, output_dict=True)

print("Trust Model Metrics:")
print(f"Accuracy: {acc:.2f}")
print(f"Precision: {prec:.2f}")
print(f"Recall: {rec:.2f}")
print(f"F1-Score: {f1:.2f}")

metrics = {
    "model_version": "trust-model-v1",
    "dataset_size": len(df),
    "accuracy": acc,
    "precision": prec,
    "recall": rec,
    "f1_score": f1,
    "classification_report": report_dict
}

with open("models/trust_metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

joblib.dump(pipeline, "models/trust_model_v1.joblib")
print("Model saved to models/trust_model_v1.joblib")
