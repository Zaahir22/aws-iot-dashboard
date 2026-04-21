/**
 * Anomaly Store
 * A simple in-memory storage for collecting diagnostic and anomaly data 
 * across the application lifecycle. Specifically for project demo purposes.
 */

class AnomalyStore {
  constructor() {
    this.records = [];
    this.maxRecords = 50; // Keep last 50 diagnostic events
    this.subscribers = [];
  }

  /**
   * Adds a new diagnostic record to the store.
   * @param {Object} record - The diagnostic data
   */
  addRecord(record) {
    const newRecord = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...record
    };

    this.records = [newRecord, ...this.records].slice(0, this.maxRecords);
    this.notifySubscribers();
  }

  /**
   * Returns all stored records.
   */
  getRecords() {
    return this.records;
  }

  /**
   * Clears all stored records.
   */
  clear() {
    this.records = [];
    this.notifySubscribers();
  }

  /**
   * Exports records as a JSON string.
   */
  exportJSON() {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * Subscription mechanism for UI components to listen for updates.
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.records));
  }
}

// Export as a singleton
export const anomalyStore = new AnomalyStore();
