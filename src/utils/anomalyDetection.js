import { SYSTEM_THRESHOLDS } from '../config/systemThresholds';

/**
 * detectAnomaly
 * Pure function to calculate if a given health score is an anomaly 
 * based on historical data.
 * 
 * @param {Array} history - Rolling window of health scores
 * @param {Number} current - The latest health score
 * @returns {Object} { isAnomaly, anomalyReason, stats: { mean, stdDev, zScore, suddenDrop } }
 */
export function detectAnomaly(history, current) {
  const { minHistoryPoints, zScoreThreshold, suddenDropThreshold } = SYSTEM_THRESHOLDS.anomaly;

  if (!Array.isArray(history) || history.length < minHistoryPoints) {
    return { isAnomaly: false, anomalyReason: '', stats: null };
  }

  const safeHistory = history.filter(v => typeof v === 'number' && !isNaN(v));
  if (safeHistory.length < minHistoryPoints) {
    return { isAnomaly: false, anomalyReason: '', stats: null };
  }

  const mean = safeHistory.reduce((a, b) => a + b, 0) / safeHistory.length;
  const variance = safeHistory.reduce((s, v) => s + (v - mean) ** 2, 0) / safeHistory.length;
  const stdDev = Math.sqrt(variance);

  // Guard against division by zero or near-zero stdDev
  if (stdDev < 0.001) {
    return { isAnomaly: false, anomalyReason: '', stats: { mean, stdDev, zScore: 0, suddenDrop: false } };
  }

  const safeCurrentVal = typeof current === 'number' && !isNaN(current) ? current : mean;
  const zScore = Math.abs((safeCurrentVal - mean) / stdDev);
  const diff = safeCurrentVal - mean;
  const suddenJump = diff > suddenDropThreshold;

  let isAnomaly = false;
  let anomalyReason = '';

  if (zScore > zScoreThreshold) {
    isAnomaly = true;
    anomalyReason = 'Unusual health trend deviation detected';
  } else if (suddenJump) {
    isAnomaly = true;
    anomalyReason = 'Sudden health score deterioration detected';
  }

  return {
    isAnomaly,
    anomalyReason,
    stats: {
      mean: Number(mean.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      zScore: Number(zScore.toFixed(4)),
      suddenJump,
      diff: Number(diff.toFixed(4))
    }
  };
}

/**
 * predictFutureScore
 * Basic linear regression or trend estimation for demo purposes.
 */
export function predictFutureScore(history) {
  if (!history || history.length < 5) return null;
  
  const n = history.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += history[i];
    sumXY += i * history[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const futureScore = slope * (n + SYSTEM_THRESHOLDS.prediction.futureSteps) + intercept;
  const safeFuture = Math.min(1, Math.max(0, futureScore));
  
  return {
    score: Number(safeFuture.toFixed(4)),
    trend: slope > 0 ? 'WORSENING' : 'IMPROVING',
    status: safeFuture > SYSTEM_THRESHOLDS.prediction.criticalThreshold ? 'CRITICAL' : 'STABLE'
  };
}
