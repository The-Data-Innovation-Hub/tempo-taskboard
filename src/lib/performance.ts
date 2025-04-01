import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";

type MetricName = "CLS" | "FID" | "LCP" | "FCP" | "TTFB";

interface MetricData {
  name: MetricName;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
}

// Store metrics in memory for local viewing
const metrics: Record<string, MetricData> = {};

// Custom reporter function
const reportMetric = (metric: MetricData) => {
  // Store metric in memory
  metrics[metric.name] = metric;

  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${metric.name}:`, metric.value);
  }

  // Send to analytics service if in production
  if (import.meta.env.PROD) {
    // You can replace this with your analytics service
    // Example: sendToAnalytics(metric);
    console.log(
      `[Performance] Sending ${metric.name} to analytics:`,
      metric.value,
    );
  }
};

// Function to measure component render time
export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${componentName} render time:`,
        renderTime.toFixed(2),
        "ms",
      );
    }

    // You can also send this to your analytics service
    return renderTime;
  };
};

// Function to measure function execution time
export const measureFunctionExecution = <T extends (...args: any[]) => any>(
  fn: T,
  fnName: string,
): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();

    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${fnName} execution time:`,
        (endTime - startTime).toFixed(2),
        "ms",
      );
    }

    return result;
  };
};

// Function to get all collected metrics
export const getAllMetrics = () => {
  return metrics;
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  // Core Web Vitals
  onCLS(reportMetric);
  onFID(reportMetric);
  onLCP(reportMetric);
  onFCP(reportMetric);
  onTTFB(reportMetric);

  // Add performance observer for long tasks
  if (typeof PerformanceObserver !== "undefined") {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (import.meta.env.DEV) {
            console.log(
              "[Performance] Long Task:",
              entry.duration.toFixed(2),
              "ms",
            );
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.error("Long task observer not supported", e);
    }
  }

  // Track route changes
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const startTime = performance.now();
    const result = originalPushState.apply(this, args);

    // Mark route change in performance timeline
    performance.mark("route-change-start");

    // Wait for next frame to measure render time
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark("route-change-end");
        performance.measure(
          "route-change",
          "route-change-start",
          "route-change-end",
        );

        const navigationTime = performance.now() - startTime;
        if (import.meta.env.DEV) {
          console.log(
            "[Performance] Route change time:",
            navigationTime.toFixed(2),
            "ms",
          );
        }
      });
    });

    return result;
  };

  console.log("[Performance] Monitoring initialized");
};
