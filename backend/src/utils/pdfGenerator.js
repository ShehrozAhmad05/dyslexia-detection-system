const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * Generate PDF report for completed assessment.
 * @param {object} assessmentData - populated assessment object
 * @returns {Buffer} PDF buffer
 */
async function generateAssessmentPDF(assessmentData) {
  const html = buildHTMLReport(assessmentData);
  const configuredExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const executablePath = configuredExecutablePath &&
    fs.existsSync(configuredExecutablePath)
    ? configuredExecutablePath
    : undefined;
  const isLinux = process.platform === 'linux';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: isLinux
      ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process'
        ]
      : ['--disable-gpu']
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
  const explainability = assessment.explainability || null;
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
    page-break-inside: auto;
    break-inside: auto;
  }
  thead { display: table-header-group; }
  tbody { display: table-row-group; }
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: auto;
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
  .shap-bar-container {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 2px 0;
  }
  .shap-bar {
    height: 10px;
    border-radius: 3px;
    min-width: 2px;
  }
  @media print {
    .section {
      page-break-inside: auto;
      break-inside: auto;
      overflow: visible;
    }
    .section-header {
      page-break-after: avoid;
      break-after: avoid-page;
    }
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
<!-- EXPLAINABILITY REPORT -->
${buildExplainabilitySection(explainability)}
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
      <thead>
        <tr><th>Metric</th><th>Value</th></tr>
      </thead>
      <tbody>
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
      </tbody>
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

function buildExplainabilitySection(explainability) {
  if (!explainability) return '';

  const fusion = explainability.fusion || {};
  const hw = explainability.handwriting || null;
  const rd = explainability.reading || null;
  const ks = explainability.keystroke || null;
  const mem = explainability.memory || null;

  // Helper for risk color in PDF
  function sectionRiskColor(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('high') || s.includes('risk') ||
        s.includes('elevated') || s.includes('errors')) {
      return '#c62828';
    }
    if (s.includes('moderate')) return '#e65100';
    return '#2e7d32';
  }

  // Build weighted contribution table rows
  const contribRows = (fusion.weightedContributions || [])
    .map(m => `
      <tr>
        <td>${escapeHtml(
          (m.module || '').charAt(0).toUpperCase() +
          (m.module || '').slice(1)
        )}</td>
        <td style="font-weight:600;color:${getRiskColor(
          m.score >= 67 ? 'high' : m.score >= 34 ? 'moderate' : 'low'
        )}">${escapeHtml(String(m.score ?? 'N/A'))}/100</td>
        <td>${escapeHtml(String(
          Number((m.weight || 0) * 100).toFixed(0)
        ))}%</td>
        <td>${escapeHtml(String(
          m.contribution != null ? Number(m.contribution).toFixed(1) : 'N/A'
        ))}</td>
        <td>${escapeHtml(String(m.percentage ?? 'N/A'))}</td>
      </tr>`)
    .join('');

  // Build top risk factors
  const topFactors = (fusion.topRiskFactors || [])
    .map(f => `
      <div style="display:flex;align-items:center;gap:8px;
                  margin-bottom:6px;padding:6px;
                  background:#f9f9f9;border-radius:4px;">
        <span style="font-weight:700;color:#555">#${escapeHtml(String(f.rank ?? ''))}</span>
        <span style="padding:2px 8px;border-radius:10px;
                     background:${getRiskColor((f.impact || '').toLowerCase())};
                     color:white;font-size:11px;font-weight:600">
          ${escapeHtml(f.impact || '')}
        </span>
        <span style="font-size:12px">
          <strong>${escapeHtml(
            (f.module || '').charAt(0).toUpperCase() +
            (f.module || '').slice(1)
          )}:</strong>
          ${escapeHtml(f.factor || '')}
          Score: ${escapeHtml(String(f.score ?? 'N/A'))}/100
        </span>
      </div>`)
    .join('');

  // Build SHAP rows for keystroke
  const shapRows = ks
    ? (ks.shapExplanation || []).map(s => `
        <tr>
          <td>${escapeHtml(s.displayName || s.feature || '')}</td>
          <td style="font-weight:600;
                     color:${s.direction === 'increases_anomaly' ? '#c62828' : '#2e7d32'}">
            ${escapeHtml(String(
              s.shapValue != null ? Number(s.shapValue).toFixed(4) : 'N/A'
            ))}
          </td>
          <td style="color:${s.direction === 'increases_anomaly' ? '#c62828' : '#2e7d32'}">
            ${s.direction === 'increases_anomaly'
              ? 'toward anomaly'
              : 'toward normal'}
          </td>
          <td>
            <span style="padding:1px 6px;border-radius:8px;
                         font-size:10px;font-weight:600;
                         background:${
                           s.impact === 'HIGH' ? '#ffebee' :
                           s.impact === 'MEDIUM' ? '#fff3e0' : '#e8f5e9'
                         };color:${
                           s.impact === 'HIGH' ? '#c62828' :
                           s.impact === 'MEDIUM' ? '#e65100' : '#2e7d32'
                         }">
              ${escapeHtml(s.impact || '')}
            </span>
          </td>
          <td style="font-size:11px;color:#555">
            ${escapeHtml(s.interpretation || '')}
          </td>
        </tr>`)
      .join('')
    : '';

  return `
<div class="section">
  <div class="section-header">Explainability Report</div>
  <div class="section-body">

    <!-- Overall explanation -->
    <div style="margin-bottom:16px">
      <strong style="font-size:13px">Why This Score Was Given</strong>
      <p style="margin:8px 0;font-size:12px;line-height:1.6">
        ${escapeHtml(fusion.naturalLanguage || 'N/A')}
      </p>
      <p style="font-size:11px;color:#777;margin:4px 0">
        ${escapeHtml(fusion.confidenceStatement || '')}
      </p>
      <div style="padding:8px 12px;border-left:3px solid #1976d2;
                  background:#f0f4f8;margin-top:8px;font-size:12px">
        ${escapeHtml(fusion.overallInterpretation || '')}
      </div>
    </div>

    <!-- Weighted contributions table -->
    <div style="margin-bottom:16px">
      <strong style="font-size:13px">Module Risk Contributions</strong>
      <table style="margin-top:8px">
        <tr>
          <th>Module</th>
          <th>Score</th>
          <th>Weight</th>
          <th>Contribution</th>
          <th>% of Total</th>
        </tr>
        ${contribRows}
      </table>
    </div>

    <!-- Top risk factors -->
    ${topFactors ? `
    <div style="margin-bottom:16px">
      <strong style="font-size:13px">Top Risk Factors</strong>
      <div style="margin-top:8px">${topFactors}</div>
    </div>` : ''}

    <!-- Handwriting explanation -->
    ${hw ? `
    <div style="margin-bottom:16px">
      <strong style="font-size:13px;color:#1976d2">
        Handwriting Explanation
      </strong>
      <p style="font-size:12px;margin:6px 0;line-height:1.6">
        ${escapeHtml(hw.naturalLanguage || '')}
      </p>
      ${(hw.featureBreakdown || []).length ? `
      <table style="margin-top:6px">
        <tr><th>Feature</th><th>Value</th><th>Status</th></tr>
        ${(hw.featureBreakdown || []).map(f => `
          <tr>
            <td>${escapeHtml(f.feature || '')}</td>
            <td style="font-weight:600">${escapeHtml(f.value || '')}</td>
            <td style="color:${sectionRiskColor(f.status)};font-weight:600">
              ${escapeHtml(f.status || '')}
            </td>
          </tr>`).join('')}
      </table>` : ''}
      ${(hw.keyFindings || []).length ? `
      <div style="margin-top:8px">
        <strong style="font-size:11px">Key Findings:</strong>
        ${(hw.keyFindings || []).map(f =>
          `<div style="font-size:11px;padding:2px 0">
             ${escapeHtml(f)}</div>`
        ).join('')}
      </div>` : ''}
    </div>` : ''}

    <!-- Reading explanation -->
    ${rd ? `
    <div style="margin-bottom:16px">
      <strong style="font-size:13px;color:#1976d2">
        Reading Explanation
      </strong>
      <p style="font-size:12px;margin:6px 0;line-height:1.6">
        ${escapeHtml(rd.naturalLanguage || '')}
      </p>
      ${(rd.featureComparison || []).length ? `
      <table style="margin-top:6px">
        <tr>
          <th>Feature</th><th>Value</th>
          <th>Status</th><th>Confidence</th>
        </tr>
        ${(rd.featureComparison || []).map(f => `
          <tr>
            <td>${escapeHtml(f.feature || '')}</td>
            <td style="font-weight:600">${escapeHtml(f.rawValue || '')}</td>
            <td style="color:${sectionRiskColor(f.status)};font-weight:600">
              ${escapeHtml(f.status || '')}
            </td>
            <td style="font-size:11px;color:#777">
              ${escapeHtml(f.confidence || '')}
            </td>
          </tr>`).join('')}
      </table>` : ''}
    </div>` : ''}

    <!-- Keystroke explanation -->
    ${ks ? `
    <div style="margin-bottom:16px">
      <strong style="font-size:13px;color:#1976d2">
        Keystroke Explanation
      </strong>
      <p style="font-size:12px;margin:6px 0;line-height:1.6">
        ${escapeHtml(ks.naturalLanguage || '')}
      </p>
      ${shapRows ? `
      <strong style="font-size:11px">
        SHAP Feature Impact (AI Model Explanation):
      </strong>
      <p style="font-size:10px;color:#777;margin:2px 0 6px">
        Compared against anomalous typing patterns in training data.
        Positive SHAP = nudges toward anomaly detection.
        Negative SHAP = nudges toward normal classification.
        Overall classification depends on the combined score.
      </p>
      <table style="margin-top:4px">
        <tr>
          <th>Feature</th><th>SHAP Value</th>
          <th>Direction</th><th>Impact</th><th>Interpretation</th>
        </tr>
        ${shapRows}
      </table>` : ''}
      ${(ks.riskBreakdownExplanation || []).length ? `
      <strong style="font-size:11px;display:block;margin-top:10px">
        Threshold Analysis (Aalto Dataset Norms):
      </strong>
      <table style="margin-top:4px">
        <tr><th>Component</th><th>Score</th><th>Status</th></tr>
        ${(ks.riskBreakdownExplanation || []).map(r => `
          <tr>
            <td>${escapeHtml(r.component || '')}</td>
            <td style="font-weight:600">${escapeHtml(String(Math.round(Number(r.score ?? 0))))}</td>
            <td style="color:${sectionRiskColor(r.status)};font-weight:600">
              ${escapeHtml(r.status || '')}
            </td>
          </tr>`).join('')}
      </table>
      <p style="font-size:10px;color:#777;margin-top:6px;
                border-left:2px solid #1976d2;padding-left:8px">
        Note: SHAP and threshold analyses may show different signals
        for the same feature. SHAP reflects multivariate AI model
        patterns while thresholds evaluate features individually.
        Both are valid and complementary perspectives.
      </p>` : ''}
    </div>` : ''}

    <!-- Memory explanation -->
    ${mem ? `
    <div style="margin-bottom:16px">
      <strong style="font-size:13px;color:#1976d2">
        Memory Explanation
      </strong>
      <p style="font-size:12px;margin:6px 0;line-height:1.6">
        ${escapeHtml(mem.naturalLanguage || '')}
      </p>
      ${(mem.componentBreakdown || []).length ? `
      <table style="margin-top:6px">
        <tr>
          <th>Component</th><th>Score</th>
          <th>Weight</th><th>Status</th>
        </tr>
        ${(mem.componentBreakdown || []).map(c => `
          <tr>
            <td>
              ${escapeHtml(c.component || '')}
              <div style="font-size:10px;color:#777">
                ${escapeHtml(c.interpretation || '')}
              </div>
            </td>
            <td style="font-weight:600">
              ${escapeHtml(String(Math.round(Number(c.score ?? 0))))}/100
            </td>
            <td>${escapeHtml(c.weight || '')}</td>
            <td style="color:${sectionRiskColor(c.status)};font-weight:600">
              ${escapeHtml(c.status || '')}
            </td>
          </tr>`).join('')}
      </table>` : ''}
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
