const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr) {
  if (!arr.length) return 0;
  const avg = mean(arr);
  const sq = arr.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(sq));
}

async function preprocessDSLDataset() {
  const csvPath = process.env.KEYSTROKE_DATA_PATH
    || path.resolve(__dirname, '../../../../Keystrokes_Dataset/DSL-StrongPasswordData.csv');
  const outputPath = path.resolve(__dirname, 'training_data.json');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}. Set KEYSTROKE_DATA_PATH or place file accordingly.`);
  }

  const sessions = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const holdTimes = [];
        const flightTimes = [];

        Object.keys(row).forEach((key) => {
          const value = parseFloat(row[key]);
          if (Number.isNaN(value)) return;

          if (key.startsWith('H.')) {
            holdTimes.push(value * 1000); // seconds -> ms
          } else if (key.startsWith('DD.')) {
            flightTimes.push(value * 1000);
          }
        });

        if (holdTimes.length && flightTimes.length) {
          const avgHold = mean(holdTimes);
          const avgFlight = mean(flightTimes);
          const stdHold = std(holdTimes);
          const stdFlight = std(flightTimes);

          sessions.push({
            avgHoldTime: avgHold,
            stdHoldTime: stdHold,
            cvHoldTime: avgHold ? (stdHold / avgHold) * 100 : 0,
            avgFlightTime: avgFlight,
            stdFlightTime: stdFlight,
            cvFlightTime: avgFlight ? (stdFlight / avgFlight) * 100 : 0
          });
        }
      })
      .on('end', () => {
        fs.writeFileSync(outputPath, JSON.stringify(sessions, null, 2));
        console.log(`✅ Preprocessed ${sessions.length} sessions -> ${outputPath}`);
        resolve(sessions);
      })
      .on('error', reject);
  });
}

if (require.main === module) {
  preprocessDSLDataset()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error during preprocessing:', err.message);
      process.exit(1);
    });
}

module.exports = { preprocessDSLDataset };
