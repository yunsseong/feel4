/**
 * Performance and Memory Monitoring Utilities
 * Tracks app performance metrics and memory usage
 */

export interface PerformanceMetrics {
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usagePercentage: number;
  };
  navigationTiming?: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
  resourceTiming?: {
    totalResources: number;
    totalSize: number;
    avgLoadTime: number;
  };
}

/**
 * Get current memory usage information
 */
export function getMemoryUsage(): PerformanceMetrics['memoryUsage'] | null {
  if (typeof window === 'undefined') return null;

  // Check if performance.memory is available (Chromium-based browsers)
  const memory = (performance as any).memory;
  if (!memory) return null;

  const usedJSHeapSize = memory.usedJSHeapSize;
  const totalJSHeapSize = memory.totalJSHeapSize;
  const jsHeapSizeLimit = memory.jsHeapSizeLimit;

  return {
    usedJSHeapSize,
    totalJSHeapSize,
    jsHeapSizeLimit,
    usagePercentage: (usedJSHeapSize / jsHeapSizeLimit) * 100,
  };
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get navigation timing metrics
 */
export function getNavigationTiming(): PerformanceMetrics['navigationTiming'] | null {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  // Get paint timings
  const paintEntries = performance.getEntriesByType('paint');
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
  const firstContentfulPaint = paintEntries.find(
    entry => entry.name === 'first-contentful-paint'
  );

  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    firstPaint: firstPaint?.startTime,
    firstContentfulPaint: firstContentfulPaint?.startTime,
  };
}

/**
 * Get resource timing metrics
 */
export function getResourceTiming(): PerformanceMetrics['resourceTiming'] | null {
  if (typeof window === 'undefined') return null;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  if (resources.length === 0) return null;

  const totalSize = resources.reduce(
    (sum, resource) => sum + (resource.transferSize || 0),
    0
  );

  const totalLoadTime = resources.reduce(
    (sum, resource) => sum + resource.duration,
    0
  );

  return {
    totalResources: resources.length,
    totalSize,
    avgLoadTime: totalLoadTime / resources.length,
  };
}

/**
 * Get all performance metrics
 */
export function getAllMetrics(): PerformanceMetrics {
  return {
    memoryUsage: getMemoryUsage() || undefined,
    navigationTiming: getNavigationTiming() || undefined,
    resourceTiming: getResourceTiming() || undefined,
  };
}

/**
 * Monitor memory usage and warn if threshold is exceeded
 */
export function monitorMemoryUsage(
  thresholdPercentage: number = 80,
  onWarning?: (usage: PerformanceMetrics['memoryUsage']) => void
) {
  if (typeof window === 'undefined') return;

  const checkMemory = () => {
    const memory = getMemoryUsage();
    if (!memory) return;

    if (memory.usagePercentage >= thresholdPercentage) {
      console.warn(
        `Memory usage high: ${memory.usagePercentage.toFixed(2)}% (${formatBytes(
          memory.usedJSHeapSize
        )} / ${formatBytes(memory.jsHeapSizeLimit)})`
      );
      onWarning?.(memory);
    }
  };

  // Check every 30 seconds
  const interval = setInterval(checkMemory, 30000);

  // Initial check
  checkMemory();

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics() {
  if (typeof window === 'undefined') return;

  const metrics = getAllMetrics();

  console.group('📊 Performance Metrics');

  if (metrics.memoryUsage) {
    console.group('💾 Memory Usage');
    console.log(
      `Used: ${formatBytes(metrics.memoryUsage.usedJSHeapSize)} / ${formatBytes(
        metrics.memoryUsage.jsHeapSizeLimit
      )}`
    );
    console.log(`Usage: ${metrics.memoryUsage.usagePercentage.toFixed(2)}%`);
    console.groupEnd();
  }

  if (metrics.navigationTiming) {
    console.group('⏱️ Navigation Timing');
    console.log(`DOM Content Loaded: ${metrics.navigationTiming.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.navigationTiming.loadComplete.toFixed(2)}ms`);
    if (metrics.navigationTiming.firstPaint) {
      console.log(`First Paint: ${metrics.navigationTiming.firstPaint.toFixed(2)}ms`);
    }
    if (metrics.navigationTiming.firstContentfulPaint) {
      console.log(
        `First Contentful Paint: ${metrics.navigationTiming.firstContentfulPaint.toFixed(2)}ms`
      );
    }
    console.groupEnd();
  }

  if (metrics.resourceTiming) {
    console.group('📦 Resource Timing');
    console.log(`Total Resources: ${metrics.resourceTiming.totalResources}`);
    console.log(`Total Size: ${formatBytes(metrics.resourceTiming.totalSize)}`);
    console.log(`Avg Load Time: ${metrics.resourceTiming.avgLoadTime.toFixed(2)}ms`);
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Development-only performance monitor
 */
export function enablePerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;

  // Log metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceMetrics();
    }, 1000);
  });

  // Monitor memory usage
  return monitorMemoryUsage(80, (usage) => {
    console.warn('High memory usage detected!', {
      used: formatBytes(usage.usedJSHeapSize),
      limit: formatBytes(usage.jsHeapSizeLimit),
      percentage: `${usage.usagePercentage.toFixed(2)}%`,
    });
  });
}
