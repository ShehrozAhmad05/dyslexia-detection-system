const puppeteer = require('puppeteer');

/**
 * Generate PDF report for completed assessment.
 * @param {object} assessmentData - populated assessment object
 * @returns {Buffer} PDF buffer
 */
async function generateAssessmentPDF(assessmentData) {
  const html = buildHTMLReport(assessmentData);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    // Puppeteer may return Uint8Array on some versions; ensure Buffer for Express binary send.
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Build complete HTML report string.
 */
function buildHTMLReport(data) {
  const {
    assessment,
    userName,
    generatedAt
  } = data;

  const overallScore = assessment.overallRiskScore ?? 'N/A';
  const riskLevel = assessment.riskLevel || 'unknown';
  const riskColor = getRiskColor(riskLevel);
  const moduleResults = assessment.moduleResults || {};
  const combinedRecs = assessment.fusionAnalysis?.combinedRecommendations || [];
  const moduleScores = assessment.fusionAnalysis?.moduleScores || {};
  const completedAt = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : new Date(generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #222;
    background: #fff;
  }
  .header {
    background: #1976d2;
    color: white;
    padding: 28px 30px 20px;
    margin-bottom: 24px;
  }
  .header h1 { font-size: 24px; margin-bottom: 4px; }
  .header p  { font-size: 13px; opacity: 0.85; }
  .section {
    margin: 0 0 20px 0;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
  }
  .section-header {
    background: #f5f5f5;
    padding: 10px 16px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #e0e0e0;
    color: #1976d2;
  }
  .section-body { padding: 16px; }
  .score-card {
    text-align: center;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 6px;
    margin-bottom: 16px;
  }
  .score-number {
    font-size: 56px;
    font-weight: 700;
    color: ${riskColor};
    line-height: 1;
  }
  .risk-badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
    background: ${riskColor};
    color: white;
    font-weight: 600;
    font-size: 14px;
    margin-top: 8px;
    text-transform: uppercase;
  }
  .module-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }
  .module-card {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 14px;
  }
  .module-card h4 {
    font-size: 13px;
    color: #555;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .module-score {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }
  .module-risk {
    font-size: 11px;
    font-weight: 600;
    margin-top: 4px;
    text-transform: uppercase;
  }
  .progress-bar-wrap {
    background: #e0e0e0;
    border-radius: 4px;
    height: 8px;
    margin-top: 8px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    background: #f0f4f8;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #ddd;
  }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .rec-list { list-style: none; padding: 0; }
  .rec-list li {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    padding-left: 16px;
    position: relative;
  }
  .rec-list li:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #1976d2;
    font-weight: bold;
  }
  .rec-list li:last-child { border-bottom: none; }
  .disclaimer {
    font-size: 11px;
    color: #888;
    padding: 12px 16px;
    background: #fafafa;
    border-top: 1px solid #e0e0e0;
    margin-top: 20px;
    border-radius: 4px;
  }
  .meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 12px;
    color: #555;
  }
  .confidence {
    font-size: 12px;
    color: #777;
    margin-top: 8px;
  }
  .word-results {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .word-chip {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }
  .chip-correct     { background: #e8f5e9; color: #2e7d32; }
  .chip-reversal    { background: #ffebee; color: #c62828; }
  .chip-substitution{ background: #fff3e0; color: #e65100; }
  .chip-multi_error { background: #f3e5f5; color: #6a1b9a; }
  .chip-deleted     { background: #f3e5f5; color: #6a1b9a; }
  @media print {
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- COVER HEADER -->
<div class="header">
  <h1>Dyslexia Screening Assessment Report</h1>
  <p>Prepared for: <strong>${escapeHtml(userName || 'User')}</strong></p>
  <p>Assessment Date: ${completedAt}</p>
  <p>Generated: ${new Date(generatedAt).toLocaleString('en-GB')}</p>
</div>

<!-- OVERALL RISK SCORE -->
<div class="section">
  <div class="section-header">Overall Risk Assessment</div>
  <div class="section-body">
    <div class="score-card">
      <div class="score-number">${overallScore}</div>
      <div style="font-size:12px;color:#777;margin-top:4px;">out of 100</div>
      <div class="risk-badge">${riskLevel.toUpperCase()} RISK</div>
      ${assessment.fusionAnalysis?.confidenceScore != null
        ? `<div class="confidence">Confidence: ${assessment.fusionAnalysis.confidenceScore}% (${assessment.completedModules?.length || 0}/4 modules completed)</div>`
        : ''}
    </div>

    <!-- MODULE SCORES GRID -->
    <div class="module-grid">
      ${buildModuleCard('Handwriting', moduleScores.handwriting, moduleResults.handwriting?.riskLevel)}
      ${buildModuleCard('Reading', moduleScores.reading, moduleResults.reading?.riskLevel)}
      ${buildModuleCard('Keystroke', moduleScores.keystroke, moduleResults.keystroke?.riskLevel)}
      ${buildModuleCard('Memory', moduleScores.memory, moduleResults.memory?.riskLevel)}
    </div>

    <!-- SCORE TABLE -->
    <table>
      <tr>
        <th>Module</th>
        <th>Score (0-100)</th>
        <th>Risk Level</th>
        <th>Weight</th>
      </tr>
      ${buildModuleRow('Handwriting', moduleScores.handwriting, moduleResults.handwriting?.riskLevel, '25%')}
      ${buildModuleRow('Reading', moduleScores.reading, moduleResults.reading?.riskLevel, '25%')}
      ${buildModuleRow('Keystroke', moduleScores.keystroke, moduleResults.keystroke?.riskLevel, '25%')}
      ${buildModuleRow('Memory', moduleScores.memory, moduleResults.memory?.riskLevel, '25%')}
      <tr style="font-weight:600;background:#f9f9f9;">
        <td>Overall</td>
        <td>${overallScore}</td>
        <td>${riskLevel.toUpperCase()}</td>
        <td>100%</td>
      </tr>
    </table>
  </div>
</div>

<!-- HANDWRITING MODULE -->
${buildHandwritingSection(moduleResults.handwriting)}

<!-- READING MODULE -->
${buildReadingSection(moduleResults.reading)}

<!-- KEYSTROKE MODULE -->
${buildKeystrokeSection(moduleResults.keystroke)}

<!-- MEMORY MODULE -->
${buildMemorySection(moduleResults.memory)}

<!-- COMBINED RECOMMENDATIONS -->
<div class="section">
  <div class="section-header">Combined Recommendations</div>
  <div class="section-body">
    <ul class="rec-list">
      ${combinedRecs
        .map(formatRecommendationText)
        .filter(Boolean)
        .map(r => `<li>${escapeHtml(r)}</li>`)
        .join('')}
    </ul>
  </div>
</div>

<!-- DISCLAIMER -->
<div class="disclaimer">
  <strong>Important:</strong> This report is generated by an automated screening tool
  and does not constitute a clinical diagnosis of dyslexia or any other condition.
  Results are intended to support — not replace — professional assessment.
  Please consult a qualified educational psychologist or specialist for formal evaluation.
  Methodology references: Isa et al. (2019), Brooks et al. (2011), Broman (1979),
  BHK Scale (Hamstra-Bletz & Blöte, 1993).
</div>

</body>
</html>`;
}

function buildModuleCard(name, score, riskLevel) {
  const color = getRiskColor(riskLevel || 'unknown');
  const pct = score != null ? Math.min(score, 100) : 0;
  return `
    <div class="module-card">
      <h4>${name}</h4>
      <div class="module-score" style="color:${color}">
        ${score != null ? Math.round(score) : 'N/A'}
      </div>
      <div class="module-risk" style="color:${color}">
        ${riskLevel ? riskLevel.toUpperCase() : 'NOT COMPLETED'}
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill"
             style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
}

function buildModuleRow(name, score, riskLevel, weight) {
  return `
    <tr>
      <td>${name}</td>
      <td>${score != null ? Math.round(score) : 'Not completed'}</td>
      <td style="color:${getRiskColor(riskLevel || 'unknown')};font-weight:600">
        ${riskLevel ? riskLevel.toUpperCase() : '-'}
      </td>
      <td>${weight}</td>
    </tr>`;
}

function buildHandwritingSection(hw) {
  if (!hw) return buildEmptySection('Handwriting Analysis', 'Not completed');
  return `
<div class="section">
  <div class="section-header">Handwriting Analysis</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Risk Score</td><td>${hw.overallScore ?? 'N/A'} / 100</td></tr>
      <tr><td>Risk Level</td>
          <td style="color:${getRiskColor(hw.riskLevel)};font-weight:600">
            ${hw.riskLevel?.toUpperCase() || '-'}
          </td></tr>
      <tr><td>Reversals Detected</td>
          <td>${hw.reversalCount ?? 'N/A'}</td></tr>
      <tr><td>Expected Sentence</td>
          <td>${escapeHtml(hw.expectedSentence || 'N/A')}</td></tr>
      <tr><td>Detected Sentence</td>
          <td>${escapeHtml(hw.detectedSentence || 'N/A')}</td></tr>
    </table>
    ${hw.wordResults?.length ? `
    <div style="margin-top:12px">
      <strong style="font-size:12px">Word Analysis:</strong>
      <div class="word-results">
        ${hw.wordResults.map(w => `
          <span class="word-chip chip-${w.errorType || 'correct'}"
                title="${escapeHtml(w.expectedWord)} → ${escapeHtml(w.writtenWord)}">
            ${escapeHtml(w.expectedWord)}
            ${w.errorType !== 'correct' ? ` → ${escapeHtml(w.writtenWord)}` : ''}
            ${w.detail ? ` (${escapeHtml(w.detail)})` : ''}
          </span>`).join('')}
      </div>
    </div>` : ''}
    ${buildRecommendations(hw.recommendations)}
  </div>
</div>`;
}

function buildReadingSection(rd) {
  if (!rd) return buildEmptySection('Reading Assessment', 'Not completed');
  return `
<div class="section">
  <div class="section-header">Reading Assessment</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Risk Score</td><td>${rd.riskScore ?? 'N/A'} / 100</td></tr>
      <tr><td>Risk Level</td>
          <td style="color:${getRiskColor(rd.riskLevel)};font-weight:600">
            ${rd.riskLevel?.toUpperCase() || '-'}
          </td></tr>
    </table>
    ${buildRecommendations(rd.recommendations)}
  </div>
</div>`;
}

function buildKeystrokeSection(ks) {
  if (!ks) return buildEmptySection('Keystroke Analysis', 'Not completed');

  const breakdown = ks.riskBreakdown || {};
  const recs = buildKeystrokeRecommendationsForPDF(ks);

  return `
<div class="section">
  <div class="section-header">Keystroke Analysis</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Risk Score</td>
          <td>${ks.riskScore ?? 'N/A'} / 100</td></tr>
      <tr><td>Risk Level</td>
          <td style="color:${getRiskColor(ks.riskLevel)};font-weight:600">
            ${(ks.riskLevel || '-').toUpperCase()}
          </td></tr>
      <tr><td>Anomaly Score</td>
          <td>${ks.anomalyScore != null
            ? Number(ks.anomalyScore).toFixed(3)
            : 'N/A'}</td></tr>
      ${breakdown.speedRisk != null
        ? `<tr><td>Speed Risk</td><td>${Math.round(breakdown.speedRisk)}</td></tr>`
        : ''}
      ${breakdown.pauseRisk != null
        ? `<tr><td>Pause Risk</td><td>${Math.round(breakdown.pauseRisk)}</td></tr>`
        : ''}
      ${breakdown.backspaceRisk != null
        ? `<tr><td>Backspace Risk</td><td>${Math.round(breakdown.backspaceRisk)}</td></tr>`
        : ''}
      ${breakdown.errorRateRisk != null
        ? `<tr><td>Error Rate Risk</td><td>${Math.round(breakdown.errorRateRisk)}</td></tr>`
        : ''}
    </table>
    ${recs.length ? `
    <div style="margin-top:12px">
      <strong style="font-size:12px">Recommendations:</strong>
      <ul class="rec-list" style="margin-top:6px">
        ${recs.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
    </div>` : ''}
  </div>
</div>`;
}

function buildKeystrokeRecommendationsForPDF(ks) {
  if (!ks) return [];
  const breakdown = ks.riskBreakdown || {};
  const recs = [];

  if ((ks.riskLevel || '').toUpperCase() === 'HIGH') {
    recs.push('High overall risk detected. Repeat the assessment at a similar time of day.');
  } else if ((ks.riskLevel || '').toUpperCase() === 'MODERATE') {
    recs.push('Moderate risk detected. Track trends over multiple sessions.');
  } else {
    recs.push('Low risk detected. Continue periodic monitoring.');
  }

  if ((breakdown.speedRisk || 0) >= 60) {
    recs.push('Typing speed is a major contributor. Practice short timed passages.');
  }
  if ((breakdown.pauseRisk || 0) >= 60) {
    recs.push('Frequent long pauses detected. Type in phrase-level chunks.');
  }
  if ((breakdown.backspaceRisk || 0) >= 60) {
    recs.push('Correction behavior is elevated. Prioritize first-pass accuracy.');
  }
  if ((breakdown.errorRateRisk || 0) >= 30) {
    recs.push('Text error rate is meaningful. Add spelling and word-pattern drills.');
  }

  return recs;
}

function buildMemorySection(mem) {
  if (!mem) return buildEmptySection('Memory Assessment', 'Not completed');
  return `
<div class="section">
  <div class="section-header">Memory Assessment</div>
  <div class="section-body">
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Risk Score</td><td>${mem.riskScore ?? 'N/A'} / 100</td></tr>
      <tr><td>Risk Level</td>
          <td style="color:${getRiskColor(mem.riskLevel)};font-weight:600">
            ${mem.riskLevel?.toUpperCase() || '-'}
          </td></tr>
    </table>
    ${buildRecommendations(mem.recommendations)}
  </div>
</div>`;
}

function buildEmptySection(title, message) {
  return `
<div class="section">
  <div class="section-header">${title}</div>
  <div class="section-body">
    <p style="color:#999;font-style:italic">${message}</p>
  </div>
</div>`;
}

function buildRecommendations(recs) {
  if (!recs || !recs.length) return '';
  const normalized = recs
    .map(formatRecommendationText)
    .filter(Boolean);
  if (!normalized.length) return '';
  return `
    <div style="margin-top:12px">
      <strong style="font-size:12px">Recommendations:</strong>
      <ul class="rec-list" style="margin-top:6px">
        ${normalized.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
    </div>`;
}

function formatRecommendationText(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    if (typeof item.message === 'string' && item.message.trim()) {
      return item.message;
    }
    if (typeof item.metric === 'string' && item.metric.trim()) {
      return item.metric;
    }
  }
  if (item == null) return '';
  return String(item);
}

function getRiskColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'high':     return '#c62828';
    case 'moderate': return '#e65100';
    case 'low':      return '#2e7d32';
    default:         return '#757575';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { generateAssessmentPDF };
