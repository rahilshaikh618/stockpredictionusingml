const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend port
    credentials: true
}));
app.use(express.json()); // To parse JSON body

// ✅ Prediction route
app.post('/api/predict', (req, res) => {
    try {
        const { symbol, startDate, endDate } = req.body;
        console.log("✅ Received request:", { symbol, startDate, endDate });

        if (!symbol || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const inputPayload = JSON.stringify({
            symbol: symbol.toUpperCase(),
            start: startDate,
            end: endDate
        });

        // ✅ Resolve the full absolute path of predict.py
        const scriptPath = path.resolve(__dirname, 'predict.py');
        console.log("📂 Looking for Python script at:", scriptPath);

        // ✅ Check if file exists before running
        if (!fs.existsSync(scriptPath)) {
            console.error("❌ Python script not found at:", scriptPath);
            return res.status(500).json({ error: 'Python script not found', path: scriptPath });
        }

        // ✅ Spawn Python process
        const pythonProcess = spawn('python', [scriptPath, inputPayload]);

        let output = '';
        let errorOutput = '';

        // ⏳ Set a 30-second timeout (adjust as needed)
        let responded = false;
        const timeout = setTimeout(() => {
            pythonProcess.kill(); // kill the Python process if it takes too long
            console.error("❌ Python script timed out.");
            return res.status(500).json({ error: "Python script timed out." });
        }, 300000); // 30,000 ms = 30 sec


        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
         clearTimeout(timeout); 
            console.log("🔚 Python exited with code", code);
            if (code !== 0) {
                console.error("❌ Python stderr:", errorOutput);
                return res.status(500).json({ error: 'Prediction failed', details: errorOutput });
            }

            try {
                const result = JSON.parse(output);
                res.json(result);
            } catch (err) {
                console.error("❌ JSON parse error:", err.message);
                res.status(500).json({ error: 'Invalid prediction output', details: err.message });
            }
        });

    } catch (err) {
        console.error("❌ Server error:", err.message);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ✅ Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
