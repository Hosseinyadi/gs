import { useEffect, useState } from 'react';
import { usePerformance } from '@/hooks/usePerformance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Wifi, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  X
} from 'lucide-react';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  showInProduction = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { 
    metrics, 
    networkInfo, 
    isSlowConnection, 
    optimizationSuggestions,
    isGoodPerformance 
  } = usePerformance();

  // Only show in development or if explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    // Show performance monitor with keyboard shortcut (Ctrl+Shift+P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    if (shouldShow) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isVisible, shouldShow]);

  if (!shouldShow || !isVisible) {
    return null;
  }

  const formatTime = (time: number | undefined) => {
    if (!time) return 'N/A';
    return `${Math.round(time)}ms`;
  };

  const getPerformanceColor = (value: number | undefined, thresholds: [number, number]) => {
    if (!value) return 'gray';
    if (value <= thresholds[0]) return 'green';
    if (value <= thresholds[1]) return 'yellow';
    return 'red';
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 text-sm">
          {/* Overall Performance */}
          <div className="flex items-center gap-2">
            {isGoodPerformance ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="font-medium">
              {isGoodPerformance ? 'عملکرد خوب' : 'نیاز به بهینه‌سازی'}
            </span>
          </div>

          {/* Core Web Vitals */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-gray-600">Core Web Vitals</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">LCP:</span>
                <Badge 
                  variant="outline" 
                  className={`ml-1 text-${getPerformanceColor(metrics.largestContentfulPaint, [2500, 4000])}-600`}
                >
                  {formatTime(metrics.largestContentfulPaint)}
                </Badge>
              </div>
              
              <div>
                <span className="text-gray-500">FID:</span>
                <Badge 
                  variant="outline"
                  className={`ml-1 text-${getPerformanceColor(metrics.firstInputDelay, [100, 300])}-600`}
                >
                  {formatTime(metrics.firstInputDelay)}
                </Badge>
              </div>
              
              <div>
                <span className="text-gray-500">CLS:</span>
                <Badge 
                  variant="outline"
                  className={`ml-1 text-${getPerformanceColor((metrics.cumulativeLayoutShift || 0) * 1000, [100, 250])}-600`}
                >
                  {metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
                </Badge>
              </div>
              
              <div>
                <span className="text-gray-500">FCP:</span>
                <Badge 
                  variant="outline"
                  className={`ml-1 text-${getPerformanceColor(metrics.firstContentfulPaint, [1800, 3000])}-600`}
                >
                  {formatTime(metrics.firstContentfulPaint)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-gray-600 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Network
            </h4>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <Badge 
                  variant={isSlowConnection ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {networkInfo.effectiveType || 'Unknown'}
                </Badge>
              </div>
              
              {networkInfo.downlink && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Speed:</span>
                  <span>{networkInfo.downlink} Mbps</span>
                </div>
              )}
              
              {networkInfo.rtt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">RTT:</span>
                  <span>{networkInfo.rtt}ms</span>
                </div>
              )}
              
              {networkInfo.saveData && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Zap className="w-3 h-3" />
                  <span>Data Saver Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Optimization Suggestions */}
          {optimizationSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-gray-600">پیشنهادات</h4>
              <ul className="space-y-1 text-xs">
                {optimizationSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1 text-orange-600">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Load Times */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-gray-600">Load Times</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">DOM Ready:</span>
                <span>{formatTime(metrics.domContentLoaded)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Load Complete:</span>
                <span>{formatTime(metrics.loadTime)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 bg-black/50 text-white px-2 py-1 rounded">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;