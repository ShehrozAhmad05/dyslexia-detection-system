const { spawn } = require('child_process');
const path = require('path');

async function predictAnomaly(features) {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, 'predict.py');
    // Use virtual environment Python if available, fallback to system Python
    const pythonPath = process.env.PYTHON_PATH || 'd:/FYP/Code/.venv/Scripts/python.exe';
    const python = spawn(pythonPath, [script]);

    let output = '';
    let errorOutput = '';

    python.stdin.write(JSON.stringify(features));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python exited with code ${code}: ${errorOutput}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

async function explainAnomaly(features) {
  return new Promise((resolve) => {
    const fallback = {
      anomalyScore: 0,
      isAnomalous: false,
      shapValues: []
    };

    try {
      const scriptPath = path.join(__dirname, 'explain.py');
      // Python path is configured via PYTHON_PATH in backend/.env
      // Each developer sets their own path in .env:
      //   Windows venv: PYTHON_PATH=D:\path\to\.venv\Scripts\python.exe
      //   Mac/Linux venv: PYTHON_PATH=/path/to/.venv/bin/python
      //   System Python fallback: PYTHON_PATH=python
      const pythonPath = process.env.PYTHON_PATH || 'python';

      const proc = spawn(pythonPath, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('close', (code) => {
        if (code !== 0) {
          console.error('explain.py stderr:', stderr);
          resolve(fallback);
          return;
        }
        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseErr) {
          console.error('explain.py parse error:', parseErr);
          resolve(fallback);
        }
      });

      proc.on('error', (err) => {
        console.error('explain.py spawn error:', err);
        resolve(fallback);
      });

      proc.stdin.write(JSON.stringify(features));
      proc.stdin.end();
    } catch (err) {
      console.error('explain.py unexpected error:', err);
      resolve(fallback);
    }
  });
}

module.exports = { predictAnomaly, explainAnomaly };
