import React, { useEffect } from "react";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { measureComponentRender } from "@/lib/performance";

const PerformancePage: React.FC = () => {
  // Measure render time of this component
  const endMeasure = measureComponentRender("PerformancePage");

  useEffect(() => {
    // Record render completion time
    const renderTime = endMeasure();

    // Cleanup function
    return () => {
      // Any cleanup code if needed
    };
  }, []);

  return <PerformanceMonitor />;
};

export default PerformancePage;
