function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function percentLabel(value, decimals = 0) {
  const num = toNumber(value, 0);
  return `${num.toFixed(decimals)}%`;
}

function isHigh(score) {
  return toNumber(score, 0) >= 70;
}

function isModerate(score) {
  const val = toNumber(score, 0);
  return val >= 40 && val < 70;
}

function capitalize(text) {
  const str = String(text || '');
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeRatePercent(rate) {
  const value = toNumber(rate, 0);
  return value <= 1 ? value * 100 : value;
}

function explainHandwriting(hw) {
  const fallback = {
    naturalLanguage: 'Handwriting explanation is unavailable.',
    keyFindings: [],
    primaryIndicator: 'No significant handwriting indicators detected',
    riskContribution: 'Handwriting contribution could not be determined.',
    featureBreakdown: []
  };

  try {
    if (!hw) return fallback;

    const analysis = hw?.analysisResults || {};
    const wordResults = safeArray(analysis?.wordResults);
    const reversalCount = toNumber(analysis?.reversalCount, 0);
    const substitutionCount = toNumber(analysis?.substitutionCount, 0);
    const multiErrorCount = toNumber(analysis?.multiErrorCount, 0);
    const correctCount = toNumber(analysis?.correctCount, 0);
    const reversalRate = normalizeRatePercent(analysis?.reversalRate);
    const reversalScore = toNumber(analysis?.featureScores?.reversalScore, 0);
    const errorScore = toNumber(analysis?.featureScores?.errorScore, 0);
    const overallScore = toNumber(analysis?.overallScore, 0);

    const totalWords = Math.max(
      wordResults.length,
      reversalCount + substitutionCount + multiErrorCount + correctCount,
      1
    );

    let naturalLanguage = '';
    if (reversalCount > 0) {
      naturalLanguage =
        `${reversalCount} out of ${totalWords} words contained letter reversal errors, ` +
        `representing a reversal rate of ${reversalRate.toFixed(0)}%.`;
      if (reversalRate >= 20) {
        naturalLanguage +=
          ' This exceeds the 20% risk threshold, indicating a meaningful reversal ' +
          'pattern consistent with dyslexia indicators (Isa et al., 2019).';
      }
    } else {
      naturalLanguage = 'No letter reversals were detected in the handwriting sample.';
    }

    if (substitutionCount > 0) {
      naturalLanguage += ` Additionally, ${substitutionCount} substitution error(s) were detected.`;
    }

    const reversalFindings = wordResults
      .filter((w) => String(w?.errorType || '').toLowerCase().includes('reversal'))
      .map((w) =>
        `Letter '${w?.expectedWord || ''}' was written as '${w?.writtenWord || ''}' ` +
        `(${w?.detail || 'letter'} reversal)`
      );

    const substitutionFindings = wordResults
      .filter((w) => String(w?.errorType || '').toLowerCase().includes('substitution'))
      .map((w) =>
        `Word '${w?.expectedWord || ''}' was written incorrectly as '${w?.writtenWord || ''}'`
      );

    const keyFindings = [...reversalFindings, ...substitutionFindings].slice(0, 5);

    const primaryIndicator = reversalCount > 0
      ? 'Letter reversal pattern detected'
      : substitutionCount > 0
        ? 'Letter substitution errors detected'
        : 'No significant handwriting indicators detected';

    const featureBreakdown = [
      {
        feature: 'Reversal Rate',
        value: `${Math.round(reversalRate)}%`,
        status: reversalRate >= 20 ? 'At Risk' : 'Normal'
      },
      {
        feature: 'Reversal Score',
        value: `${Math.round(reversalScore)}/100`,
        status: reversalScore > 50 ? 'Elevated' : 'Normal'
      },
      {
        feature: 'Error Score',
        value: `${Math.round(errorScore)}/100`,
        status: errorScore > 50 ? 'Elevated' : 'Normal'
      },
      {
        feature: 'Words Correct',
        value: `${correctCount}/${totalWords}`,
        status: correctCount === totalWords ? 'All Correct' : 'Errors Found'
      }
    ];

    const riskContribution =
      `Handwriting module score was ${Math.round(overallScore)}/100, ` +
      `${overallScore >= 67 ? 'indicating high contribution to risk.' : overallScore >= 34
        ? 'indicating moderate contribution to risk.'
        : 'indicating low contribution to overall risk.'}`;

    return {
      naturalLanguage: naturalLanguage || fallback.naturalLanguage,
      keyFindings,
      primaryIndicator,
      riskContribution,
      featureBreakdown
    };
  } catch (error) {
    return fallback;
  }
}

function readingStatusFromNormalized(normalized) {
  if (toNumber(normalized, 0) >= 70) return 'High Risk';
  if (toNumber(normalized, 0) >= 40) return 'Moderate';
  return 'Normal';
}

function explainReading(rd) {
  const fallback = {
    naturalLanguage: 'Reading explanation is unavailable.',
    keyFindings: [],
    primaryIndicator: 'No significant reading indicators detected',
    featureComparison: []
  };

  try {
    if (!rd) return fallback;

    const fs = rd?.featureScores || {};
    const readingTimeRaw = toNumber(fs?.readingTime?.raw, toNumber(rd?.totalReadingTime, 0) / 1000);
    const comprehensionScore = toNumber(rd?.comprehensionScore, toNumber(fs?.comprehension?.raw, 0));
    const totalRevisits = toNumber(rd?.totalRevisits, toNumber(fs?.revisitCount?.raw, 0));
    const pauseCount = toNumber(rd?.pauseCount, toNumber(fs?.pauseCount?.raw, 0));
    const avgPauseDuration = toNumber(rd?.averagePauseDuration, toNumber(fs?.avgPauseDuration?.raw, 0));

    const featureComparison = [
      {
        feature: 'Reading Time',
        rawValue: `${Math.round(readingTimeRaw)}s`,
        normalizedScore: toNumber(fs?.readingTime?.normalized, 0),
        confidence: String(fs?.readingTime?.confidence || 'N/A'),
        status: readingStatusFromNormalized(fs?.readingTime?.normalized),
        interpretation: 'Reading time was significantly above average'
      },
      {
        feature: 'Comprehension',
        rawValue: `${Math.round(comprehensionScore)}%`,
        normalizedScore: toNumber(fs?.comprehension?.normalized, Math.max(0, 100 - comprehensionScore)),
        confidence: String(fs?.comprehension?.confidence || 'N/A'),
        status: comprehensionScore < 50 ? 'High Risk' : comprehensionScore < 70 ? 'Moderate' : 'Normal',
        interpretation: comprehensionScore < 70
          ? 'Comprehension score was below the expected threshold'
          : 'Comprehension score was within expected range'
      },
      {
        feature: 'Revisits',
        rawValue: `${totalRevisits} revisits`,
        normalizedScore: toNumber(fs?.revisitCount?.normalized, 0),
        confidence: String(fs?.revisitCount?.confidence || 'N/A'),
        status: totalRevisits >= 10 ? 'High Risk' : totalRevisits >= 6 ? 'Moderate' : 'Normal',
        interpretation: 'Revisiting sections may indicate comprehension difficulty'
      },
      {
        feature: 'Pause Count',
        rawValue: `${pauseCount} pauses`,
        normalizedScore: toNumber(fs?.pauseCount?.normalized, 0),
        confidence: String(fs?.pauseCount?.confidence || 'N/A'),
        status: pauseCount >= 10 ? 'High Risk' : pauseCount >= 5 ? 'Moderate' : 'Normal',
        interpretation: 'Frequent pauses may indicate decoding or processing strain'
      },
      {
        feature: 'Average Pause Duration',
        rawValue: avgPauseDuration ? `${(avgPauseDuration / 1000).toFixed(1)}s` : 'N/A',
        normalizedScore: toNumber(fs?.avgPauseDuration?.normalized, 0),
        confidence: String(fs?.avgPauseDuration?.confidence || 'N/A'),
        status: avgPauseDuration >= 5000 ? 'Elevated' : 'Normal',
        interpretation: avgPauseDuration >= 5000
          ? 'Long pauses suggest increased reading effort'
          : 'Pause duration remained within normal range'
      }
    ];

    const topTwo = [...featureComparison]
      .sort((a, b) => toNumber(b?.normalizedScore, 0) - toNumber(a?.normalizedScore, 0))
      .slice(0, 2);

    const first = topTwo[0];
    const second = topTwo[1];
    const naturalLanguage = first && second
      ? `${first.feature} and ${second.feature} were the primary risk indicators. ` +
        `${first.feature} (${first.rawValue}) was above the normal range, and ` +
        `${second.feature} (${second.rawValue}) was below the expected threshold.`
      : 'Reading indicators were limited, but available features were analyzed.';

    const keyFindings = featureComparison
      .filter((f) => f?.status !== 'Normal')
      .sort((a, b) => toNumber(b?.normalizedScore, 0) - toNumber(a?.normalizedScore, 0))
      .slice(0, 3)
      .map((f) => `${f.feature}: ${f.interpretation}`);

    const primaryIndicator = first
      ? `${first.feature} was the strongest reading indicator`
      : 'No significant reading indicators detected';

    return {
      naturalLanguage: naturalLanguage || fallback.naturalLanguage,
      keyFindings,
      primaryIndicator,
      featureComparison
    };
  } catch (error) {
    return fallback;
  }
}

function explainKeystroke(ks) {
  const fallback = {
    naturalLanguage: 'Keystroke explanation is unavailable.',
    keyFindings: [],
    primaryIndicator: 'No significant keystroke indicators detected',
    shapExplanation: [],
    riskBreakdownExplanation: []
  };

  try {
    if (!ks) return fallback;

    const displayNames = {
      avgHoldTime: 'Key Hold Duration',
      cvHoldTime: 'Hold Time Variability',
      avgFlightTime: 'Key Flight Duration',
      cvFlightTime: 'Flight Time Variability',
      wpm: 'Typing Speed',
      pauseFrequency: 'Pause Frequency',
      pauseDuration: 'Pause Duration',
      backspaceRate: 'Backspace Rate'
    };

    const interpretationMap = {
      avgHoldTime: {
        increases_anomaly: 'Key hold duration contributed toward anomaly detection',
        decreases_anomaly: 'Key hold duration contributed toward normal classification'
      },
      cvHoldTime: {
        increases_anomaly: 'Irregular key hold times contributed toward anomaly detection',
        decreases_anomaly: 'Hold time variability was consistent with normal typing'
      },
      avgFlightTime: {
        increases_anomaly: 'Key flight duration contributed toward anomaly detection',
        decreases_anomaly: 'Key flight duration was consistent with normal typing'
      },
      cvFlightTime: {
        increases_anomaly: 'Variable time between keys contributed toward anomaly detection',
        decreases_anomaly: 'Time between keys was relatively stable and consistent'
      },
      wpm: {
        increases_anomaly: 'Typing speed contributed toward anomaly detection',
        decreases_anomaly: 'Typing speed contributed toward normal classification'
      },
      pauseFrequency: {
        increases_anomaly: 'Pause frequency contributed toward anomaly detection',
        decreases_anomaly: 'Pause frequency was within expected range'
      },
      pauseDuration: {
        increases_anomaly: 'Pause duration contributed toward anomaly detection',
        decreases_anomaly: 'Pause duration did not indicate abnormal delay'
      },
      backspaceRate: {
        increases_anomaly: 'Correction rate contributed toward anomaly detection',
        decreases_anomaly: 'Correction rate was within normal limits'
      }
    };

    const shapExplanation = safeArray(ks?.shapValues)
      .map((item) => {
        const feature = String(item?.feature || '');
        const direction = String(item?.direction || 'decreases_anomaly');
        const mapped = interpretationMap[feature]?.[direction];
        return {
          feature,
          displayName: displayNames[feature] || feature,
          shapValue: toNumber(item?.shapValue, 0),
          direction,
          impact: String(item?.impact || 'LOW'),
          interpretation: mapped || (
            direction === 'increases_anomaly'
              ? 'This feature contributed toward anomaly detection.'
              : 'This feature contributed toward normal classification.'
          )
        };
      });

    const breakdownSource = ks?.riskBreakdown || {};
    const riskBreakdownExplanation = [
      ['holdTimeRisk', 'Hold Time Risk'],
      ['flightTimeRisk', 'Flight Time Risk'],
      ['backspaceRisk', 'Backspace Risk'],
      ['pauseRisk', 'Pause Risk'],
      ['speedRisk', 'Typing Speed Risk'],
      ['errorRateRisk', 'Error Rate Risk']
    ].map(([key, label]) => {
      const score = toNumber(breakdownSource?.[key], 0);
      return {
        component: label,
        score,
        status: score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low'
      };
    });

    const topTwo = shapExplanation.slice(0, 2).map((s) => s.displayName).join(' and ');
    const topIncreasing = shapExplanation
      .filter((s) => s.direction === 'increases_anomaly')
      .slice(0, 2)
      .map((s) => s.displayName)
      .join(' and ');
    const naturalLanguage = ks?.isAnomalous
      ? `Anomalous typing patterns were detected ` +
        `(anomaly score: ${toNumber(ks?.anomalyScore, 0).toFixed(3)}). ` +
        `The primary contributing features were ` +
        `${topTwo || 'multiple typing features'}.`
      : `Typing patterns were within normal range ` +
        `(anomaly score: ${toNumber(ks?.anomalyScore, 0).toFixed(3)}). ` +
        (topIncreasing
          ? `While ${topIncreasing} nudged the score toward anomaly, ` +
            `the combined typing pattern was classified as normal ` +
            `by the AI model.`
          : 'All features contributed toward normal classification.');

    const primaryIndicator = ks?.isAnomalous
      ? (shapExplanation[0]?.displayName
          ? `${shapExplanation[0].displayName} was the primary anomaly contributor`
          : 'Anomalous keystroke pattern detected')
      : 'Typing patterns within normal range';

    const keyFindings = shapExplanation
      .slice(0, 3)
      .map((item) => `${item.displayName}: ${item.interpretation}`);

    return {
      naturalLanguage: naturalLanguage || fallback.naturalLanguage,
      keyFindings,
      primaryIndicator,
      shapExplanation,
      riskBreakdownExplanation
    };
  } catch (error) {
    return fallback;
  }
}

function explainMemory(mem) {
  const fallback = {
    naturalLanguage: 'Memory explanation is unavailable.',
    keyFindings: [],
    primaryIndicator: 'No significant memory indicators detected',
    componentBreakdown: []
  };

  try {
    if (!mem) return fallback;

    const rb = mem?.riskBreakdown || {};
    const metrics = mem?.metrics || {};
    const componentBreakdown = [
      {
        key: 'accuracyRisk',
        component: 'Accuracy',
        weight: '40%',
        interpretation: 'Percentage of correct responses'
      },
      {
        key: 'capacityRisk',
        component: 'Memory Capacity',
        weight: '30%',
        interpretation: 'Maximum sequence length recalled'
      },
      {
        key: 'speedRisk',
        component: 'Response Speed',
        weight: '20%',
        interpretation: 'Average time to respond'
      },
      {
        key: 'consistencyRisk',
        component: 'Consistency',
        weight: '10%',
        interpretation: 'Variability in response times'
      }
    ].map((item) => {
      const score = toNumber(rb?.[item.key], 0);
      return {
        component: item.component,
        score,
        weight: item.weight,
        status: score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'Normal',
        interpretation: item.interpretation
      };
    });

    const accuracy = toNumber(metrics?.accuracy, 0);
    const maxSequenceLength = toNumber(metrics?.maxSequenceLength, 0);
    const accuracyRisk = toNumber(rb?.accuracyRisk, 0);
    const capacityRisk = toNumber(rb?.capacityRisk, 0);

    let naturalLanguage =
      `Memory accuracy was ${accuracy.toFixed(1)}% and maximum sequence length was ` +
      `${maxSequenceLength} items.`;
    if (accuracyRisk >= 60) {
      naturalLanguage +=
        ' Accuracy was significantly below the expected range for this age group.';
    }
    if (capacityRisk >= 60) {
      naturalLanguage += ' Memory capacity was below typical range.';
    }

    const topTwo = [...componentBreakdown]
      .sort((a, b) => toNumber(b?.score, 0) - toNumber(a?.score, 0))
      .slice(0, 2);

    const keyFindings = topTwo.map(
      (item) => `${item.component} scored ${Math.round(item.score)}/100 (${item.status}).`
    );

    const primaryIndicator = topTwo[0]?.component
      ? `${topTwo[0].component} was the primary memory indicator`
      : 'No significant memory indicators detected';

    return {
      naturalLanguage: naturalLanguage || fallback.naturalLanguage,
      keyFindings,
      primaryIndicator,
      componentBreakdown
    };
  } catch (error) {
    return fallback;
  }
}

function countCompletedModules(assessment) {
  try {
    if (typeof assessment?.getCompletedModules === 'function') {
      return safeArray(assessment.getCompletedModules()).length;
    }
  } catch (error) {
    // fall through to fallback counting
  }

  const modules = [
    assessment?.handwritingResult,
    assessment?.readingResult,
    assessment?.keystrokeResult,
    assessment?.memoryResult
  ];
  return modules.filter(Boolean).length;
}

function explainFusion(assessment) {
  const fallback = {
    naturalLanguage: 'Overall fusion explanation is unavailable.',
    topRiskFactors: [],
    weightedContributions: [],
    confidenceStatement: 'Assessment confidence could not be determined.',
    overallInterpretation: 'Insufficient data for overall interpretation.'
  };

  try {
    if (!assessment) return fallback;

    const moduleScores = assessment?.fusionAnalysis?.moduleScores || {};
    const moduleWeights = assessment?.fusionAnalysis?.moduleWeights || {
      handwriting: 0.25,
      reading: 0.25,
      keystroke: 0.25,
      memory: 0.25
    };
    const overallRiskScore = toNumber(assessment?.overallRiskScore, 0);
    const riskLevel = String(assessment?.riskLevel || 'unknown').toLowerCase();

    const weightedContributions = ['handwriting', 'reading', 'keystroke', 'memory']
      .map((module) => {
        const score = toNumber(moduleScores?.[module], 0);
        const weight = toNumber(moduleWeights?.[module], 0);
        const contribution = score * weight;
        const pct = overallRiskScore > 0 ? (contribution / overallRiskScore) * 100 : 0;
        return {
          module,
          score: Math.round(score),
          weight,
          contribution: Number(contribution.toFixed(2)),
          percentage: `${pct.toFixed(1)}%`
        };
      })
      .sort((a, b) => toNumber(b?.contribution, 0) - toNumber(a?.contribution, 0));

    const factorMap = {
      handwriting: 'Letter reversal rate',
      reading: 'Reading comprehension and speed',
      keystroke: 'Typing rhythm anomaly',
      memory: 'Memory accuracy and capacity'
    };

    const topRiskFactors = [...weightedContributions]
      .sort((a, b) => toNumber(b?.score, 0) - toNumber(a?.score, 0))
      .slice(0, 3)
      .map((item, idx) => {
        const score = toNumber(item?.score, 0);
        return {
          rank: idx + 1,
          module: item.module,
          factor: factorMap[item.module] || 'Module risk contribution',
          score,
          impact: score >= 67 ? 'HIGH' : score >= 34 ? 'MODERATE' : 'LOW'
        };
      });

    const completedCount = countCompletedModules(assessment);
    const topModule = topRiskFactors[0];
    const highRiskModules = topRiskFactors.filter((item) => item?.impact === 'HIGH').length;
    let naturalLanguage =
      `Your overall ${riskLevel} risk score of ${Math.round(overallRiskScore)}/100 was ` +
      `calculated from ${completedCount} completed modules.`;
    if (topModule) {
      naturalLanguage +=
        ` The highest contributing factor was ${topModule.module} with a ` +
        `score of ${Math.round(topModule.score)}/100.`;
    }
    if (highRiskModules > 1) {
      naturalLanguage +=
        ' Multiple modules showed elevated risk indicators, strengthening the overall assessment.';
    }

    const confidence = toNumber(assessment?.fusionAnalysis?.confidenceScore, 0);
    let confidenceStatement =
      `This result is based on ${completedCount}/4 completed modules ` +
      `(${Math.round(confidence)}% assessment confidence).`;
    if (completedCount < 4) {
      confidenceStatement +=
        ' Completing all modules would provide a more accurate overall assessment.';
    }

    const overallInterpretation = riskLevel === 'high'
      ? 'Multiple dyslexia risk indicators detected across modules. A formal assessment by a qualified educational psychologist is strongly recommended.'
      : riskLevel === 'moderate'
        ? 'Some dyslexia risk indicators detected. Consider follow-up screening or targeted intervention strategies.'
        : 'Risk indicators are within normal range. Continue periodic monitoring.';

    return {
      naturalLanguage: naturalLanguage || fallback.naturalLanguage,
      topRiskFactors,
      weightedContributions,
      confidenceStatement: confidenceStatement || fallback.confidenceStatement,
      overallInterpretation
    };
  } catch (error) {
    return fallback;
  }
}

async function generateFullExplainability(assessment) {
  try {
    return {
      handwriting: assessment?.handwritingResult
        ? explainHandwriting(assessment.handwritingResult)
        : null,
      reading: assessment?.readingResult
        ? explainReading(assessment.readingResult)
        : null,
      keystroke: assessment?.keystrokeResult
        ? explainKeystroke(assessment.keystrokeResult)
        : null,
      memory: assessment?.memoryResult
        ? explainMemory(assessment.memoryResult)
        : null,
      fusion: explainFusion(assessment)
    };
  } catch (error) {
    return {
      handwriting: null,
      reading: null,
      keystroke: null,
      memory: null,
      fusion: explainFusion(null)
    };
  }
}

module.exports = {
  explainHandwriting,
  explainReading,
  explainKeystroke,
  explainMemory,
  explainFusion,
  generateFullExplainability
};