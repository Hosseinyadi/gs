import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [networkInfo, setNetworkInfo] = useState<Partial<NetworkInfo>>({});
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Get basic performance metrics
    const getPerformanceMetrics = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics: Partial<PerformanceMetrics> = {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        setMetrics(metrics);
      }
    };

    // Get network information
    const getNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const info: Partial<NetworkInfo> = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };

        setNetworkInfo(info);
        
        // Determine if connection is slow
        const slow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.saveData ||
                    connection.downlink < 1;
        
        setIsSlowConnection(slow);
      }
    };

    // Get Web Vitals
    const getWebVitals = () => {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime
            }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            setMetrics(prev => ({
              ...prev,
              cumulativeLayoutShift: clsValue
            }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // FID (First Input Delay)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            setMetrics(prev => ({
              ...prev,
              firstInputDelay: (firstEntry as any).processingStart - firstEntry.startTime
            }));
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

        } catch (error) {
          console.warn('Performance Observer not fully supported:', error);
        }
      }
    };

    // Run measurements
    if (document.readyState === 'complete') {
      getPerformanceMetrics();
    } else {
      window.addEventListener('load', getPerformanceMetrics);
    }

    getNetworkInfo();
    getWebVitals();

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', getNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', getNetworkInfo);
      };
    }
  }, []);

  // Performance optimization suggestions
  const getOptimizationSuggestions = () => {
    const suggestions: string[] = [];

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) {
      suggestions.push('LCP بالا است - تصاویر را بهینه کنید');
    }

    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
      suggestions.push('CLS بالا است - ابعاد عناصر را مشخص کنید');
    }

    if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
      suggestions.push('FID بالا است - JavaScript را بهینه کنید');
    }

    if (isSlowConnection) {
      suggestions.push('اتصال کند است - محتوای کمتری بارگذاری کنید');
    }

    return suggestions;
  };

  // Check if performance is good
  const isGoodPerformance = () => {
    return (
      (!metrics.largestContentfulPaint || metrics.largestContentfulPaint <= 2500) &&
      (!metrics.cumulativeLayoutShift || metrics.cumulativeLayoutShift <= 0.1) &&
      (!metrics.firstInputDelay || metrics.firstInputDelay <= 100)
    );
  };

  return {
    metrics,
    networkInfo,
    isSlowConnection,
    optimizationSuggestions: getOptimizationSuggestions(),
    isGoodPerformance: isGoodPerformance(),
  };
};

// Hook for adaptive loading based on connection
export const useAdaptiveLoading = () => {
  const { isSlowConnection, networkInfo } = usePerformance();

  const shouldReduceQuality = isSlowConnection || networkInfo.saveData;
  const shouldPreload = !isSlowConnection && !networkInfo.saveData;
  const maxImageQuality = shouldReduceQuality ? 'low' : 'high';
  const shouldLazyLoad = true; // Always use lazy loading

  return {
    shouldReduceQuality,
    shouldPreload,
    maxImageQuality,
    shouldLazyLoad,
    isSlowConnection,
  };
};