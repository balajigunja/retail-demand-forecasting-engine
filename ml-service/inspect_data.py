
import pandas as pd

file_path = "data/retail.csv"

try:
    df = pd.read_csv(file_path)

    print("\nDataset loaded successfully!")
    print("Dataset shape:", df.shape)

    print("\nColumn names:")
    print(df.columns.tolist())

    print("\nFirst 5 rows:")
    print(df.head().to_string())

    print("\nData types:")
    print(df.dtypes)

    print("\nMissing values:")
    print(df.isnull().sum())

except FileNotFoundError:
    print(f"File not found: {file_path}")
    print("Check that your CSV is inside the data folder.")
except Exception as error:
    print("Error reading CSV:", error)
