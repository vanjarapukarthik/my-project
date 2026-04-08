
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

df = pd.read_csv("revenue.csv")
X = df[["visits","rvu","denials"]]
y = df["revenue"]

model = RandomForestRegressor()
model.fit(X,y)

joblib.dump(model,"model.pkl")
print("Model trained and saved")
