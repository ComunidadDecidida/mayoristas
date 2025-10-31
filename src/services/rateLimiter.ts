export class RateLimiter {
  private requestTimestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  private minDelay: number;
  private lastRequestTime: number = 0;
  private name: string;

  constructor(
    name: string,
    maxRequests: number = 45,
    windowMs: number = 60000,
    minDelay: number = 1400
  ) {
    this.name = name;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.minDelay = minDelay;
  }

  private cleanOldTimestamps(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);
  }

  getStats(): {
    requestsInWindow: number;
    slotsAvailable: number;
    timeToNextSlot: number;
    isThrottling: boolean;
  } {
    this.cleanOldTimestamps();
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const requestsInWindow = this.requestTimestamps.length;
    const slotsAvailable = this.maxRequests - requestsInWindow;

    let timeToNextSlot = 0;
    if (timeSinceLastRequest < this.minDelay) {
      timeToNextSlot = this.minDelay - timeSinceLastRequest;
    }

    const isThrottling = requestsInWindow >= (this.maxRequests * 0.9);

    return {
      requestsInWindow,
      slotsAvailable,
      timeToNextSlot,
      isThrottling
    };
  }

  async waitForSlot(): Promise<void> {
    this.cleanOldTimestamps();
    const now = Date.now();

    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = (oldestTimestamp + this.windowMs) - now;

      if (waitTime > 0) {
        console.log(`[${this.name}] Rate limit reached. Waiting ${waitTime}ms for window to reset`);
        await this.sleep(waitTime);
        this.cleanOldTimestamps();
      }
    }

    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const delayTime = this.minDelay - timeSinceLastRequest;
      await this.sleep(delayTime);
    }

    const stats = this.getStats();
    if (stats.isThrottling) {
      const extraDelay = this.minDelay * 0.5;
      console.log(`[${this.name}] Throttling active (${stats.requestsInWindow}/${this.maxRequests}). Adding ${extraDelay}ms delay`);
      await this.sleep(extraDelay);
    }

    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(this.lastRequestTime);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.requestTimestamps = [];
    this.lastRequestTime = 0;
  }

  logStatus(): void {
    const stats = this.getStats();
    console.log(`[${this.name}] Rate Limiter Status:`, {
      requests: `${stats.requestsInWindow}/${this.maxRequests}`,
      slotsAvailable: stats.slotsAvailable,
      throttling: stats.isThrottling ? 'YES' : 'NO'
    });
  }
}
