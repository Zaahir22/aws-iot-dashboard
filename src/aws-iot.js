/**
 * AWS IoT → React bridge via SSE proxy
 * ──────────────────────────────────────
 * The proxy server (simulator/proxy.js) connects to AWS IoT using device
 * certificates and re-broadcasts data via Server-Sent Events on localhost:3010.
 * This sidesteps all Cognito / IAM / WebSocket-signing issues entirely.
 */

const PROXY_URL = 'http://localhost:3010/events';

let globalSource = null;

const connectAWS = (onData, onStatusChange) => {
  // Close any existing connection
  if (globalSource) {
    globalSource.close();
    globalSource = null;
  }

  let lastStatus = null;

  const emitStatus = (s) => {
    if (s !== lastStatus) {
      lastStatus = s;
      onStatusChange(s);
    }
  };

  emitStatus('CONNECTING');
  console.log('🔗 Connecting to IoT proxy at', PROXY_URL);

  const source = new EventSource(PROXY_URL);
  globalSource = source;

  source.onopen = () => {
    console.log('✅ SSE connection open');
    emitStatus('CONNECTED');
  };

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Internal status messages from proxy — deduplicated
      if (data.__status) {
        console.log('📡 Proxy status:', data.__status);
        emitStatus(data.__status);
        return;
      }

      // Live sensor data
      console.log('LIVE AWS DATA:', data);
      onData(data);
    } catch (e) {
      console.warn('⚠️ Failed to parse SSE message:', event.data);
    }
  };

  source.onerror = (e) => {
    const state = source.readyState;
    if (state === EventSource.CLOSED) {
      console.error('❌ SSE connection closed. Is the proxy running? (node simulator/proxy.js)');
      emitStatus('DISCONNECTED');
    } else {
      // readyState === CONNECTING  →  browser is auto-retrying, just log
      console.warn('⚠️ SSE error, browser will retry...');
      emitStatus('CONNECTING');
    }
  };

  return {
    disconnect: () => {
      if (globalSource) {
        globalSource.close();
        globalSource = null;
        console.log('🛑 SSE connection closed');
        emitStatus('DISCONNECTED');
      }
    },
  };
};

export default connectAWS;