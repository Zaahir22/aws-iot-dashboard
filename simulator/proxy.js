/**
 * IoT SSE Proxy Server
 * ─────────────────────
 * Connects to AWS IoT Core using device certificates (MQTT over TLS),
 * then bridges live data to the React frontend via Server-Sent Events (SSE).
 *
 * Run: node proxy.js  (from inside the simulator/ directory)
 */

const awsIot = require('aws-iot-device-sdk');
const http   = require('http');

const HOST        = 'ajn6olmvk0maf-ats.iot.ap-south-1.amazonaws.com';
const TOPIC       = 'dt/xmerion/+/metrics';
const PROXY_PORT  = 3010;

// ── Global Node Data Store ─────────────────────────────────────────────────────
let nodesData = {};

// ── SSE client registry ────────────────────────────────────────────────────────
const sseClients = new Set();

function broadcast(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(res => {
    try { res.write(msg); } catch (_) { sseClients.delete(res); }
  });
}

// ── Connect to AWS IoT over MQTT/TLS (using device certificates) ───────────────
const device = awsIot.device({
  keyPath:  './private.key',
  certPath: './certificate.pem',
  caPath:   './AmazonRootCA1.pem',
  clientId: `proxy-${Date.now()}`,
  host:     HOST,
});

device.on('connect', () => {
  console.log('✅ Proxy connected to AWS IoT Core');
  device.subscribe(TOPIC, { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Subscription error:', err);
    } else {
      console.log(`📡 Subscribed → ${TOPIC}`);
      broadcast({ __status: 'CONNECTED' });
    }
  });
});

device.on('message', (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    const parts = topic.split('/');
    if (parts.length >= 3) {
      const nodeId = parts[2];
      nodesData[nodeId] = data; // store securely
    }
    console.log(`📦 Received [${topic}]:`, data);
    broadcast(data);
  } catch (e) {
    console.warn('⚠️  Bad payload:', payload.toString());
  }
});

device.on('error',      (e)  => console.error('❌ MQTT error:',      e.message || e));
device.on('close',       ()  => { console.warn('🔌 MQTT closed');    broadcast({ __status: 'DISCONNECTED' }); });
device.on('reconnect',   ()  => { console.log ('🔄 MQTT reconnecting...'); broadcast({ __status: 'CONNECTING' }); });
device.on('offline',     ()  => console.warn('📴 MQTT offline'));

// ── HTTP SSE Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/data') {
    try {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(nodesData));
    } catch (err) {
      res.writeHead(500); res.end('Error');
    }
    return;
  }

  if (req.url === '/events') {
    // ── SSE endpoint ───────────────────────────────────────────────────────────
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // Disable nginx buffering if behind proxy
    });

    // Immediately send current status
    res.write(`data: ${JSON.stringify({ __status: 'CONNECTED' })}\n\n`);
    sseClients.add(res);
    console.log(`🔗 Dashboard connected  (${sseClients.size} client(s))`);

    // Heartbeat every 20 s to keep connection alive
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch (_) { clearInterval(heartbeat); }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`🔌 Dashboard disconnected  (${sseClients.size} client(s))`);
    });

  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', clients: sseClients.size }));

  } else {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`\n🚀 SSE Proxy running on http://localhost:${PROXY_PORT}/events`);
  console.log('   Dashboard will auto-connect when you open http://localhost:5173\n');
});
