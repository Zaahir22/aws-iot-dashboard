/**
 * SYSTEM_THRESHOLDS
 * Centralized configuration for all operational limits, health scoring, 
 * and AI anomaly detection parameters.
 */
export const SYSTEM_THRESHOLDS = {
  // Temperature limits in Celsius
  temperature: {
    warning: 100,
    critical: 120,
    base: 60,       // Base temperature for health calculation
    range: 25       // Range for health scoring (tmp - base) / range
  },

  // Voltage limits in kV
  voltage: {
    low: 200,
    high: 240,
    nominal: 220,   // Target voltage
    tolerance: 20   // Allowed deviation for health scoring Math.abs(vlt - nominal) / tolerance
  },

  // Current limits in Amperes
  current: {
    warning: 440,
    critical: 500
  },

  // Load Factor (0.0 to 1.0)
  loadFactor: {
    moderate: 0.65,
    warning: 0.85,
    critical: 0.95,
    base: 0.5,      // Base load for health calculation
    range: 0.35     // Range for health scoring (ldf - base) / range
  },

  // Signal strength in dBm
  signal: {
    weak: 40,
    critical: 20,
    default: 95
  },

  // Health Score (final aggregated score 0.0 to 1.0, where 1.0 is worst)
  healthScore: {
    warningThreshold: 0.79,
    criticalThreshold: 0.88,
    maxCappedScore: 0.88  // Maximum score before capping for stability
  },

  // AI Anomaly Detection Parameters
  anomaly: {
    minHistoryPoints: 5,        // Required points before analysis starts
    maxHistoryLength: 20,       // Rolling window size
    zScoreThreshold: 2.0,       // Statistical deviation limit
    suddenDropThreshold: 0.15,  // Sharp health deterioration limit
  },

  // Prediction Logic
  prediction: {
    futureSteps: 3,             // How many steps into the future to predict
    criticalThreshold: 0.6      // Threshold for "Critical" prediction
  },

  // Weightings for health scoring (must sum to 1.0)
  weights: {
    temperature: 0.4,
    voltage: 0.3,
    loadFactor: 0.3
  }
};
