import os
import base64
from io import BytesIO
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg") # Non-interactive backend for servers
import matplotlib.pyplot as plt
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title = "Battery SOH AI Service")

# Setup Gemini for AI chat
API_KEY = os.getenv("GEMINI_API_KEY", "")
if API_KEY:
    genai.configure(api_key=API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")
else:
    print("Gemini API Key not found")


print("Loading model")
try:
    artifacts = joblib.load("soh_model.pkl")
    model = artifacts["model"]
    regression_eq = artifacts["regression_equation"]
    X_test_ref = artifacts["test_data"]["X_test"]
    Y_test_ref = artifacts["test_data"]["Y_test"] 
    print("Model loaded")
except FileNotFoundError:
    print("Error: 'soh_model.pkl' not found")
    raise

# Knowledge Base
FAQ_KNOWLEDGE_BASE = {
    "health_factors": {
        "keywords": ["factor", "health", "affect", "destroy", "damage", "cause"], 
        "required_match_count": 2, 
        "answer": (
            "Here are some **key factors that affect battery health**:\n\n"
            "1. **Charge/Discharge Cycles** – Frequent fast charging or deep discharging (0–100%) accelerates wear.\n"
            "2. **Depth of Discharge (DoD)** – Keeping the battery roughly between **20–80%** is gentler.\n"
            "3. **Temperature** – Heat speeds up chemical ageing.\n"
            "4. **Charging Rate** – Fast charging generates more heat and stress.\n"
            "5. **Storage** – Store at moderate charge (40-60%) and cool temps.\n\n"
            "Your **voltage profile (U1–U21)** helps us estimate the resulting **SOH**."
        )
    },
    "extend_life": {
        "keywords": ["extend", "improve", "increase", "life", "lifespan", "save", "longer"],
        "required_match_count": 2,
        "answer": (
            "Practical ways to **extend your battery's life**:\n\n"
            "1. **Avoid extremes** – Stay between **20–80%** daily.\n"
            "2. **Limit heat** – Don't charge/store in hot environments.\n"
            "3. **Slow Charge** – Use moderate power when you can.\n"
            "4. **Avoid deep discharge** – Charge before you hit 0%.\n"
            "5. **Storage** – Keep at **40–60%** if storing for long periods."
        )
    },
    "what_is_soh": {
        "keywords": ["soh", "state of health", "meaning", "definition", "define"],
        "required_match_count": 1, 
        "answer": (
            "**State of Health (SOH)** describes **how much usable capacity a battery has left**:\n\n"
            "- **SOH = 1.0 (100%)** → Like new.\n"
            "- **SOH = 0.8 (80%)** → 80% capacity remaining.\n"
            "- **< 0.6 (60%)** → Often considered end-of-life.\n\n"
            "We use your **U1–U21 voltages** to predict this value."
        )
    },
    "voltage_range": {
        "keywords": ["voltage", "range", "optimal", "limit", "min", "max", "normal"],
        "required_match_count": 2,
        "answer": (
            "Typical **per-cell voltage ranges** (Li-ion):\n\n"
            "- **Fully charged**: ~4.1–4.2 V\n"
            "- **Nominal**: ~3.6–3.7 V\n"            "- **Min limit**: ~3.0 V (going lower damages the cell)."
        )
    }
}

# -- Helpers --

def checkFaq(user_msg: str):
    msg = user_msg.lower().strip()
    best_match = None
    highest_score = 0

    for topic, data in FAQ_KNOWLEDGE_BASE.items():
        matches = 0
        for keyword in data["keywords"]:
            if keyword in msg:
                matches += 1
        
        if matches >= data["required_match_count"]:
            if matches > highest_score:
                highest_score = matches
                best_match = data["answer"]
    
    return best_match

def performancePlot(current_soh):
    # Predict on the test set to show reference
    y_pred_ref = model.predict(X_test_ref)
    
    plt.figure(figsize=(6, 4))
    plt.scatter(Y_test_ref, y_pred_ref, alpha=0.5, label="Historical Data")
    
    # Plot the ideal line
    plt.plot([0, 1], [0, 1], "r--", alpha=0.7)
    
    # Plot the user's current point
    plt.axvline(current_soh, color="green", linestyle="--", label="Current Prediction")
    
    plt.xlabel("Actual SOH")
    plt.ylabel("Predicted SOH")
    plt.title("Model Performance vs Current Prediction")
    plt.legend()
    plt.tight_layout()
    
    buf = BytesIO()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()

# -- Data Models && Routes -- 
class predictionRequest(BaseModel):
    voltages: list[float]
    threshold: float = 0.6
    include_plots: bool = False

class chatRequest(BaseModel):
    message: str

@app.get("/")
def healtCheck():
    return {"status": "running", "model_loaded": True}

@app.post("/predict")
def predict(req: predictionRequest):

    if len(req.voltages) != 21:
        raise HTTPException(status_code = 400, detail=f"Expected 21 voltages, got {len(req.voltages)}")
    
    cols = [f"U{i}" for i in range(1,22)]
    df_input = pd.DataFrame([req.voltages], columns=cols)
    soh_raw = float(model.predict(df_input)[0])

    soh_final = max(0.0, min(1.0, soh_raw))
    classification = "Healthy" if soh_final >= req.threshold else "Unhealthy"

    plots = {}
    if req.include_plots:
        plots["performance"] = performancePlot(soh_final)

    return {
        "soh_raw": soh_raw,
        "soh": soh_final,
        "classification": classification,
        "equation": regression_eq,
        "plots": plots
    }

@app.post("/chat")
def chat(req: chatRequest):
    if not API_KEY:
        return {"reply": "AI Chat is currently disabled (No API Key)"}
    
    try:
        prompt = (
            "You are a battery health expert. "
            f"User asks: '{req.message}'. "
            "Answer briefly and professionally."
        )
        response = gemini_model.generate_content(prompt)
        return {"reply": response.text}
    except Exception as e:
        return {"reply": "Sorry, I couldn't reach the AI service", "error": str(e)}
            

