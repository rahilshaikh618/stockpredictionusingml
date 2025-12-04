import sys
import json
import requests
import pandas as pd
import numpy as np
import traceback
import os
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM

def main():
    try:
        # Input parsing
        input_data = json.loads(sys.argv[1])
        symbol = input_data["symbol"]
        start_date = input_data["start"]
        end_date = input_data["end"]

        # API request
        headers = {
            "Authorization": "Token 535002e58ec69628dd593f4be8fc0c83776092c5"
        } # Replace with your actual API key
        url = f"https://api.tiingo.com/iex/{symbol}/prices?startDate={start_date}&endDate={end_date}"

        response = requests.get(url, headers=headers)

        if not response.ok or not response.json():
            raise ValueError(f"API Error {response.status_code}: {response.text}")

        # Data preparation
        df = pd.DataFrame(response.json())
        df['date'] = pd.to_datetime(df['date'])
        close_prices = df['close'].values.reshape(-1, 1)

        # Normalization
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_prices = scaler.fit_transform(close_prices)

        # Train-test split
        train_size = int(len(scaled_prices) * 0.7)
        train, test = scaled_prices[:train_size], scaled_prices[train_size:]

        # Create sequences
        def create_sequences(data, window_size=60):
            X, y = [], []
            for i in range(len(data) - window_size - 1):
                X.append(data[i:(i + window_size), 0])
                y.append(data[i + window_size, 0])
            return np.array(X), np.array(y)

        time_step = 60
        X_train, y_train = create_sequences(train, time_step)
        X_test, y_test = create_sequences(test, time_step)

        # Reshape for LSTM
        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

        # Build LSTM model
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], 1)),
            LSTM(50),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)

        # Predictions
        train_predict = model.predict(X_train, verbose=0)
        test_predict = model.predict(X_test, verbose=0)

        # Inverse transform predictions
        train_predict = scaler.inverse_transform(train_predict)
        test_predict = scaler.inverse_transform(test_predict)

        # Future Prediction (next 30 days)
        future_steps = 30
        future_input = scaled_prices[-time_step:].reshape(1, time_step, 1)  # last window

        future_preds = []

        for _ in range(future_steps):
            next_pred = model.predict(future_input, verbose=0)
            future_preds.append(next_pred[0][0])

            # Append the prediction and shift the window
            future_input = np.append(future_input[:, 1:, :], [[[next_pred[0][0]]]], axis=1)

        # Inverse scale the predictions
        future_preds = scaler.inverse_transform(np.array(future_preds).reshape(-1, 1)).flatten().tolist()

        # Prepare output
        actual_prices = close_prices
        dates = df["date"].dt.strftime('%Y-%m-%d').tolist()

        train_pred_plot = [None] * (time_step + 1) + train_predict.flatten().tolist()
        test_pred_plot = [None] * (train_size + time_step + 1) + test_predict.flatten().tolist()

        output = {
            "dates": dates,
            "actual_close": actual_prices.flatten().tolist(),
            "train_prediction": train_pred_plot[:len(dates)],
            "test_prediction": test_pred_plot[:len(dates)],
            "future_prediction": future_preds,

            "status": "success"
        }

        print(json.dumps(output))  # ✅ Only JSON output

    except Exception as e:
        traceback.print_exc()
        print(json.dumps({"error": str(e), "status": "error"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
# Run the main function
# if __name__ == "__main__":