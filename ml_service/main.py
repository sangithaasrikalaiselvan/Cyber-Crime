from __future__ import annotations

import io
import re
from typing import Any, Optional

import fitz  # PyMuPDF
import pdfplumber
import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline

app = FastAPI(title="Cyber Crime ML Service", version="1.0.0")

# Allow local Vite dev server on any localhost port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NER pipeline (as in your Colab)
NER_MODEL_ID = "dslim/bert-base-NER"
ner_pipeline = pipeline(
    "ner",
    model=AutoModelForTokenClassification.from_pretrained(NER_MODEL_ID),
    tokenizer=AutoTokenizer.from_pretrained(NER_MODEL_ID),
    aggregation_strategy="simple",
)

# NOTE: Your Colab creates an untrained classifier (distilbert with random head).
# For now we implement keyword-based severity scoring as you described.


def clean_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img, lang="eng")


def extract_text_from_pdf_native_bytes(pdf_bytes: bytes) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_scanned_pdf_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    out: list[str] = []
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        out.append(pytesseract.image_to_string(img, lang="eng"))
    return "\n".join(out)


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    native = extract_text_from_pdf_native_bytes(pdf_bytes)
    if native.strip():
        return native
    return extract_text_from_scanned_pdf_bytes(pdf_bytes)


def extract_entities(text: str) -> dict[str, Optional[str]]:
    results = ner_pipeline(text)

    data: dict[str, Optional[str]] = {
        "name": None,
        "location": None,
        "date": None,
        "organization": None,
    }

    name_tokens: list[str] = []
    for ent in results:
        if ent.get("entity_group") == "PER":
            token = str(ent.get("word", "")).replace("##", "")
            name_tokens.append(token)
        else:
            if name_tokens and not data["name"]:
                data["name"] = " ".join(name_tokens)
                name_tokens = []
    if name_tokens and not data["name"]:
        data["name"] = " ".join(name_tokens)

    for ent in results:
        label = ent.get("entity_group")
        word = str(ent.get("word", "")).replace("##", "")
        if label in ["LOC", "GPE"] and not data["location"]:
            data["location"] = word
        elif label == "DATE" and not data["date"]:
            data["date"] = word
        elif label == "ORG" and not data["organization"]:
            data["organization"] = word

    return data


def detect_platform(text: str) -> Optional[str]:
    m = re.search(r"\b(PhonePe|Paytm|Google Pay|GPay|BHIM|UPI|SBI|HDFC|ICICI|Axis)\b", text, re.I)
    return m.group(1) if m else None


def extract_amount(text: str) -> Optional[float]:
    m = re.search(r"(?:rs\.?|₹)\s*(\d{1,3}(?:,\d{3})*)", text, re.I)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def classify_cybercrime_type(text: str) -> str:
    lower = text.lower()

    # High priority violent / harassment cases
    if "acid attack" in lower or ("acid" in lower and "attack" in lower):
        return "Acid Attack"
    if any(k in lower for k in ["harassment", "blackmail", "sextortion", "stalking", "threat"]):
        return "Cyber Harassment"

    # Robbery / theft
    if any(k in lower for k in ["robbery", "stolen", "theft", "snatched"]):
        return "Robbery"

    # Financial / banking
    if any(k in lower for k in ["bank fraud", "upi", "phonepe", "paytm", "gpay", "google pay", "bhim", "otp", "fraud", "scam"]):
        return "Bank Fraud"

    # Phishing
    if any(k in lower for k in ["phishing", "fake link", "kyc", "verify", "login", "password"]):
        return "Phishing"

    return "Online Fraud"


def severity_from_keywords(text: str) -> dict[str, Any]:
    lower = text.lower()

    # Simple priority mapping based on your examples
    high = ["harassment", "acid attack", "blackmail", "rape", "assault", "threat"]
    mid = ["robbery", "stolen", "theft"]
    second_high = ["bank fraud", "upi", "phonepe", "paytm", "gpay", "google pay", "bhim", "otp", "phishing", "fraud", "scam"]

    matched: list[str] = []

    def contains_any(keys: list[str]) -> bool:
        for k in keys:
            if k in lower:
                matched.append(k)
                return True
        return False

    if contains_any(high):
        return {"severity": "high", "severity_score": 90, "matched_keywords": matched}
    if contains_any(second_high):
        return {"severity": "medium", "severity_score": 70, "matched_keywords": matched}
    if contains_any(mid):
        return {"severity": "medium", "severity_score": 50, "matched_keywords": matched}

    # default
    return {"severity": "low", "severity_score": 30, "matched_keywords": matched}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> dict[str, Any]:
    ct = (file.content_type or "").lower()
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        if ct in ["image/png", "image/jpeg", "image/jpg"] or file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
            text = extract_text_from_image_bytes(raw)
        elif ct == "application/pdf" or file.filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf_bytes(raw)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF or image.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {e}")

    text = clean_text(text)
    entities = extract_entities(text) if text else {"name": None, "location": None, "date": None, "organization": None}
    crime_type = classify_cybercrime_type(text or "")
    sev = severity_from_keywords(text or "")

    return {
        "text": text,
        "entities": entities,
        "crime_type": crime_type,
        "category": crime_type,
        "platform": detect_platform(text) if text else None,
        "amount": extract_amount(text) if text else None,
        **sev,
    }
