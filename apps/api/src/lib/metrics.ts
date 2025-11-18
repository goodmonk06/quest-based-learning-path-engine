import { logger } from './logger';

export interface MetricLabels {
  [key: string]: string | number;
}

interface Counter {
  name: string;
  value: number;
  labels?: MetricLabels;
}

interface Gauge {
  name: string;
  value: number;
  labels?: MetricLabels;
}

interface Histogram {
  name: string;
  value: number;
  labels?: MetricLabels;
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: MetricLabels, value: number = 1) {
    const key = this.getMetricKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { name, value, labels });
    }

    logger.debug(`Counter incremented: ${name}`, { value, labels });
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: MetricLabels) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, { name, value, labels });
    logger.debug(`Gauge set: ${name}`, { value, labels });
  }

  /**
   * Record a histogram value (for distributions like request duration)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    const key = this.getMetricKey(name, labels);
    const existing = this.histograms.get(key) || [];
    existing.push({ name, value, labels });
    this.histograms.set(key, existing);
    logger.debug(`Histogram recorded: ${name}`, { value, labels });
  }

  /**
   * Record request duration
   */
  recordRequestDuration(path: string, method: string, durationMs: number, statusCode: number) {
    this.recordHistogram('http_request_duration_ms', durationMs, {
      path,
      method,
      status: statusCode,
    });
  }

  /**
   * Get all metrics (for /metrics endpoint)
   */
  getMetrics() {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: this.aggregateHistograms(),
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private getMetricKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private aggregateHistograms() {
    const aggregated: Record<string, { count: number; sum: number; avg: number; min: number; max: number }> = {};

    this.histograms.forEach((values, key) => {
      const nums = values.map(v => v.value);
      aggregated[key] = {
        count: nums.length,
        sum: nums.reduce((a, b) => a + b, 0),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
      };
    });

    return aggregated;
  }
}

export const metrics = new MetricsCollector();

// Helper to time async operations
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metrics.recordHistogram(name, duration, labels);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordHistogram(name, duration, { ...labels, error: 'true' });
    throw error;
  }
}
