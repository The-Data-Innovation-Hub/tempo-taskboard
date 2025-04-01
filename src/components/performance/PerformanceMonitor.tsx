import React, { useEffect, useState } from "react";
import { getAllMetrics } from "@/lib/performance";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import EmailMonitor from "./EmailMonitor";

interface MetricDisplayProps {
  name: string;
  value: number;
  description: string;
  threshold: number;
  unit: string;
  lowerIsBetter?: boolean;
}

const MetricDisplay = ({
  name,
  value,
  description,
  threshold,
  unit,
  lowerIsBetter = true,
}: MetricDisplayProps) => {
  const isGood = lowerIsBetter ? value <= threshold : value >= threshold;
  const progressValue = lowerIsBetter
    ? Math.min(100, (value / threshold) * 100)
    : Math.min(100, (threshold / value) * 100);

  return (
    <Card className="mb-4 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between">
          <span>{name}</span>
          <span className={isGood ? "text-green-600" : "text-red-600"}>
            {value.toFixed(2)} {unit}
          </span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress
          value={progressValue}
          className={`h-2 ${isGood ? "bg-green-100" : "bg-red-100"}`}
          indicatorClassName={isGood ? "bg-green-600" : "bg-red-600"}
        />
        <div className="flex justify-between text-xs mt-1">
          <span>0</span>
          <span className="font-medium">{`Threshold: ${threshold} ${unit}`}</span>
          <span>
            {threshold * 2} {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("core-vitals");

  useEffect(() => {
    // Update metrics every second
    const intervalId = setInterval(() => {
      setMetrics(getAllMetrics());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#0089AD]">
          Performance Monitoring Dashboard
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="core-vitals">Core Web Vitals</TabsTrigger>
            <TabsTrigger value="app-metrics">Application Metrics</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="email-system">Email System</TabsTrigger>
          </TabsList>

          <TabsContent value="core-vitals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.LCP && (
                <MetricDisplay
                  name="Largest Contentful Paint (LCP)"
                  value={metrics.LCP.value / 1000}
                  description="Time until the largest content element is rendered"
                  threshold={2.5}
                  unit="s"
                />
              )}

              {metrics.FID && (
                <MetricDisplay
                  name="First Input Delay (FID)"
                  value={metrics.FID.value}
                  description="Time from first user interaction to response"
                  threshold={100}
                  unit="ms"
                />
              )}

              {metrics.CLS && (
                <MetricDisplay
                  name="Cumulative Layout Shift (CLS)"
                  value={metrics.CLS.value}
                  description="Measure of visual stability"
                  threshold={0.1}
                  unit=""
                />
              )}

              {metrics.FCP && (
                <MetricDisplay
                  name="First Contentful Paint (FCP)"
                  value={metrics.FCP.value / 1000}
                  description="Time until first content is painted"
                  threshold={1.8}
                  unit="s"
                />
              )}

              {metrics.TTFB && (
                <MetricDisplay
                  name="Time to First Byte (TTFB)"
                  value={metrics.TTFB.value / 1000}
                  description="Time until first byte is received"
                  threshold={0.8}
                  unit="s"
                />
              )}
            </div>

            {Object.keys(metrics).length === 0 && (
              <Card className="bg-white">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">
                    Collecting metrics... This may take a moment as you interact
                    with the application.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="app-metrics">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Application Performance</CardTitle>
                <CardDescription>
                  Custom metrics for TaskBoard application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  This section will display custom application metrics like:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Project board loading time</li>
                  <li>Task card rendering performance</li>
                  <li>Drag and drop operation latency</li>
                  <li>API request timing</li>
                </ul>
                <p className="mt-4 text-gray-500">
                  These metrics will populate as you use the application.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Resource Monitoring</CardTitle>
                <CardDescription>
                  Network and resource usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  This section will show resource usage metrics like:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 mt-2">
                  <li>Network requests and timing</li>
                  <li>JavaScript memory usage</li>
                  <li>Asset loading performance</li>
                </ul>
                <p className="mt-4 text-gray-500">
                  Resource monitoring data will be available in future updates.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Export Performance Data
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="email-system">
            <EmailMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
