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

module.exports = { predictAnomaly };
