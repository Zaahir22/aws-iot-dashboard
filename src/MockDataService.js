class MockDataService {
  constructor(onData) {
    this.onData = onData;
    this.intervalId = null;
    this.nodes = ['t104'];
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      const nodeId = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      
      const payload = {
        nodeId,
        temperature: 40 + Math.random() * 60,
        voltage: 190 + Math.random() * 50,
        loadFactor: 0.5 + Math.random() * 0.5,
        alert: "NORMAL"
      };

      const randAlert = Math.random();
      if (randAlert > 0.95) {
          payload.alert = "HIGH_TEMPERATURE, LOW_VOLTAGE";
      } else if (randAlert > 0.85) {
          payload.alert = "OVERLOAD";
      } else if (randAlert > 0.75) {
          payload.alert = "HIGH_TEMPERATURE";
      } else if (randAlert > 0.65) {
          payload.alert = "LOW_VOLTAGE";
      }

      this.onData(payload);
    }, 2000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default MockDataService;
