const awsIot = require('aws-iot-device-sdk');

const device = awsIot.device({
  keyPath: './private.key',
  certPath: './certificate.pem',
  caPath: './AmazonRootCA1.pem',
  clientId: 'sim-device-' + Math.floor(Math.random() * 100000),
  host: 'ajn6olmvk0maf-ats.iot.ap-south-1.amazonaws.com'
});

// Three top-level nodes, each with 3 internal sub-phases
const NODES = [
  {
    id: 't104',
    location: 'Cooling Tower 2, North Wing',
    subNodes: [
      { id: 'A', label: 'Phase-A', tempBase: 65, voltageBase: 220, currentBase: 120 },
      { id: 'B', label: 'Phase-B', tempBase: 70, voltageBase: 230, currentBase: 250 },
      { id: 'C', label: 'Phase-C', tempBase: 75, voltageBase: 235, currentBase: 400 },
    ],
  },
  {
    id: 't105',
    location: 'Sector 7G, Industrial Bay 4',
    subNodes: [
      { id: 'A', label: 'Phase-A', tempBase: 70, voltageBase: 215, currentBase: 140 },
      { id: 'B', label: 'Phase-B', tempBase: 80, voltageBase: 220, currentBase: 270 },
      { id: 'C', label: 'Phase-C', tempBase: 85, voltageBase: 228, currentBase: 430 },
    ],
  },
  {
    id: 't106',
    location: 'Main Generator Room',
    subNodes: [
      { id: 'A', label: 'Phase-A', tempBase: 60, voltageBase: 225, currentBase: 160 },
      { id: 'B', label: 'Phase-B', tempBase: 65, voltageBase: 235, currentBase: 300 },
      { id: 'C', label: 'Phase-C', tempBase: 90, voltageBase: 210, currentBase: 460 },
    ],
  },
];

// Global state for anomaly testing
let anomalyActive = false;
let anomalyTarget = null;
let anomalyStartTime = 0;

function buildPayload(node) {
  // ── Periodic Anomaly Triggering ──
  const now = Date.now();
  if (!anomalyActive && Math.random() < 0.05) { // ~5% chance per tick to start anomaly
    anomalyActive = true;
    anomalyTarget = node.id;
    anomalyStartTime = now;
    console.log(`⚠️  SIMULATOR: Starting AI Anomaly event on ${node.id}`);
  }

  // Anomaly lasts for 45 seconds
  if (anomalyActive && anomalyTarget === node.id && (now - anomalyStartTime > 45000)) {
    anomalyActive = false;
    anomalyTarget = null;
    console.log(`✅ SIMULATOR: Clearing AI Anomaly event on ${node.id}`);
  }

  const isAnomalyNode = anomalyActive && anomalyTarget === node.id;

  const subReadings = node.subNodes.map(sub => {
    let temp = sub.tempBase + Math.random() * 5;
    let volt = sub.voltageBase + Math.random() * 2;
    let load = 0.5 + Math.random() * 0.5;

    // Inject an anomaly: Sudden drop in voltage or sudden spike in temperature
    if (isAnomalyNode) {
      if (Math.random() > 0.5) {
        volt -= 30; // Sudden brownout
      } else {
        temp += 40; // Sudden thermal spike
      }
      load = 0.95; // Heavy load contributes to stress
    }

    return {
      id: sub.id,
      label: sub.label,
      temperature: parseFloat(temp.toFixed(2)),
      voltage: parseFloat(volt.toFixed(2)),
      current: parseFloat((sub.currentBase + Math.random() * 10).toFixed(2)),
      loadFactor: parseFloat(load.toFixed(2)),
      signal: parseInt((50 + Math.random() * 50).toFixed(0), 10),
    };
  });

  const avg = (key) => {
    const sum = subReadings.reduce((acc, curr) => acc + curr[key], 0);
    return parseFloat((sum / subReadings.length).toFixed(2));
  };

  const tempAvg = avg('temperature');
  const voltAvg = avg('voltage');
  const loadAvg = avg('loadFactor');

  const TEMP_WARN = 75;
  const TEMP_CRITICAL = 85;

  let alerts = [];

  if (tempAvg >= TEMP_CRITICAL) {
    alerts.push('CRITICAL_TEMP');
  } else if (tempAvg >= TEMP_WARN) {
    alerts.push('HIGH_TEMP');
  }

  if (voltAvg < 210) {
    alerts.push('UNDER_VOLTAGE');
  } else if (voltAvg > 235) {
    alerts.push('HIGH_VOLTAGE');
  }

  let loadStatus = "NORMAL";
  if (loadAvg >= 0.85) {
    loadStatus = "CRITICAL";
    alerts.push('OVERLOAD'); // retain OVERLOAD for legacy downstream
  } else if (loadAvg >= 0.75) {
    loadStatus = "HIGH";
  } else if (loadAvg >= 0.65) {
    loadStatus = "MODERATE";
  }

  const alertPayload = alerts.length > 0 ? alerts.join(', ') : 'NORMAL';

  return {
    nodeId: node.id,
    location: node.location,
    temperature: tempAvg,
    voltage: voltAvg,
    current: avg('current'),
    loadFactor: loadAvg,
    signal: avg('signal'),
    subNodes: subReadings,
    alert: alertPayload,
    timestamp: new Date().toISOString(),
  };
}

device.on('connect', () => {
  console.log('✅ Connected to AWS IoT Core');

  setInterval(() => {
    NODES.forEach(node => {
      const payload = buildPayload(node);
      const topic = `dt/xmerion/${node.id}/metrics`;
      try {
        device.publish(topic, JSON.stringify(payload));
        console.log(`📤 [${node.id}] → ${topic} | temp=${payload.temperature}°C  volt=${payload.voltage}V  load=${payload.loadFactor}`);
      } catch (err) {
        console.error(`❌ Failed to publish [${node.id}]:`, err);
      }
    });
  }, 5000);
});

device.on('error', (e) => console.error('❌ MQTT error:', e.message || e));
device.on('close', () => console.warn('🔌 Connection closed'));
device.on('reconnect', () => console.log('🔄 Reconnecting...'));
device.on('offline', () => console.warn('📴 Offline'));