# -*- coding: utf-8 -*-
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_translator import GoogleTranslator

def detect_hi_mr(text: str) -> str:
    mr_words = ["आहे", "नाही", "आमच्या", "माझा", "माझी", "तुमचा", "काय", "कसे", "इथे", "येथे", "पासून"]
    hi_words = ["है", "नहीं", "हमारे", "मेरा", "मेरी", "आपका", "क्या", "कैसे", "यहाँ", "से", "क्यों"]

    mr_score = sum(1 for w in mr_words if w in text)
    hi_score = sum(1 for w in hi_words if w in text)

    if mr_score > hi_score:
        return "mr"
    if hi_score > mr_score:
        return "hi"
    return "hi_or_mr"
# ---------- END OF FUNCTION ----------

app = FastAPI(title="Multilingual Issue Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "API is running successfully"}

@app.post("/analyze")
def analyze_issue(payload: AnalyzeRequest):
    text = payload.text.strip()

    # -------- Language Detection --------
    if re.search(r"[\u0900-\u097F]", text):
        language = detect_hi_mr(text)
    else:
        language = "en"


    # -------- Translation --------
    translated_text = text
    if language != "en":
        try:
            translated_text = GoogleTranslator(
                source="auto", target="en"
            ).translate(text)
        except Exception:
            translated_text = text

    # -------- Summary --------
    words = translated_text.split()
    summary = " ".join(words[:18]) + ("..." if len(words) > 18 else "")

    # -------- Issue Category --------
    t = translated_text.lower()
    category_map = {
        "Water": ["water", "no water", "water problem", "water supply", "pipeline"],
        "Electricity": ["electricity", "power cut", "light", "street light"],
        "Road": ["road", "pothole", "bridge", "construction"],
        "Garbage": ["garbage", "trash", "waste", "dump"],
        "Health": ["hospital", "ambulance", "injury", "blood"],
        "Traffic": ["traffic", "signal", "parking", "jam"]
    }

    issue_category = "Other"
    for cat, keys in category_map.items():
        if any(k in t for k in keys):
            issue_category = cat
            break

    # -------- Urgency --------
    urgency_score = 0.20
    if any(k in t for k in ["fire", "accident", "emergency", "gas leak"]):
        urgency_score = 0.85
    elif any(k in t for k in ["water", "electricity", "road", "garbage"]):
        urgency_score += 0.25

    if "since" in t or "days" in t:
        urgency_score += 0.10

    urgency_score = min(urgency_score, 1.0)

    risk_level = (
        "HIGH" if urgency_score >= 0.8
        else "MEDIUM" if urgency_score >= 0.45
        else "LOW"
    )

    return {
        "input_text": text,
        "language": language,
        "translated_text": translated_text,
        "summary": summary,
        "issue_category": issue_category,
        "urgency_score": round(urgency_score, 2),
        "risk_level": risk_level
    }


