// client/src/components/StockPredictor.js
// For Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// For DatePicker
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import React, { useState } from 'react';
import './StockPredictor.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockPredictor = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState(new Date('2020-01-01'));
  const [endDate, setEndDate] = useState(new Date());
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'FB', 'NFLX'];

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch('http://localhost:5000/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symbol,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  })
});

    
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.error);
    setPredictionData(data);
  } catch (err) {
    console.error("Fetch Error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const chartData = {
    labels: predictionData?.dates || [],
    datasets: [
      {
        label: 'Actual Close Price',
        data: predictionData?.actual_close || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Training Prediction',
        data: predictionData?.train_prediction || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1
      },
      {
        label: 'Test Prediction',
        data: predictionData?.test_prediction || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  const futureChartData = {
    labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Future Prediction',
        data: predictionData?.future_prediction || [],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="stock-predictor">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Stock Symbol:</label>
            <div className="symbol-buttons">
              {popularSymbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  className={`symbol-btn ${symbol === sym ? 'active' : ''}`}
                  onClick={() => setSymbol(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol"
            />
          </div>
          
          <div className="form-group">
            <label>Start Date:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
            />
          </div>
          
          <div className="form-group">
            <label>End Date:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Predicting...' : 'Predict'}
          </button>
        </form>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {predictionData && (
        <div className="charts-container">
          <div className="chart">
            <h2>Stock Price Prediction</h2>
            <Line data={chartData} />
          </div>
          
          <div className="chart">
            <h2>30-Day Future Prediction</h2>
            <Line data={futureChartData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPredictor;