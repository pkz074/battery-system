import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

# --- CONFIG --- 
DATA_FILE = "PulseBat_Dataset.xlsx"
SHEET_NAME = "SOC ALL"
FEATURE_COLORS = [f"U{i}" for i in range(1, 22)]

def train(): 
    print(f"Loading data from {DATA_FILE}...")
    try:
        df = pd.read_excel(DATA_FILE, sheet_name=SHEET_NAME)
    except FileNotFoundError:
        print("Error: Excel file not found")
        return
    
    df.columns = (
        df.columns.str.strip()
        .str.replace(r"\(.*\)", "", regex=True)
        .str.replace(r"[_\.\s]+", "", regex=True)
        .str.upper()
    )

    if "SOH" not in df.columns:
        print("Error: SOH column not found in the data sheet")
        return
    
    X = df[FEATURE_COLORS]
    Y = df["SOH"]

    print("Training model..")
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

    # Model Fitting
    model = LinearRegression()
    model.fit(X_train, Y_train)

    # Metrics

    Y_pred = model.predict(X_test)
    r2 = r2_score(Y_test, Y_pred)
    mse = mean_squared_error(Y_test, Y_pred)

    print("Training Complete")
    print(f"R2 Score: {r2:.4f}")
    print(f"MSE: {mse:.4f}")

    # Equation string for UI

    coefs = model.coef_
    intercept = model.intercept_
    equation_parts = [f"{intercept:.4f}"]

    for i, c in enumerate(coefs, start=1):
        sign = "+" if c>=0 else "-"
        equation_parts.append(f" {sign} {abs(c):.4f}*U{i}")
    regression = "SOH = " + "".join(equation_parts)


    artifacts = {
            "model": model,
            "regression_equation": regression,
            "metrics": {"r2": r2, "mse": mse},
            "test_data": {
                "X_test": X_test,  
                "Y_test": Y_test
            }
        }
    
    joblib.dump(artifacts, "soh_model.pkl")
    print("Model saved to soh_model.pkl")

if __name__ == "__main__":
    train()

