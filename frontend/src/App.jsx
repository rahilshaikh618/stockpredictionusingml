// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import StockPredictor from './components/StockPredictor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<StockPredictor />} />
        </Routes>
      </div>
    </Router>
  );
}

function NavBar() {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">Stock Predictor</Link>
      </div>
    </nav>
  );
}

export default App;