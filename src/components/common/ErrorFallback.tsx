import React from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

/**
 * A reusable error fallback component that can be used with React Error Boundary
 * for component-level error handling.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  componentName = "component",
}) => {
  const { toast } = useToast();

  React.useEffect(() => {
    // Log the error to console in development
    if (import.meta.env.DEV) {
      console.error(`Error in ${componentName}:`, error);
    }

    // In production, we could send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example of structured logging
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      console.error(
        `COMPONENT ERROR (${componentName}):`,
        JSON.stringify(errorData),
      );
    }
  }, [error, componentName]);

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-red-600">Component Error</h3>
        {import.meta.env.DEV && (
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            {componentName}
          </span>
        )}
      </div>

      {import.meta.env.DEV ? (
        <>
          <p className="text-sm text-gray-700 mb-2">{error.message}</p>
          {error.stack && (
            <pre className="text-xs bg-gray-100 p-2 rounded mb-3 overflow-auto max-h-32">
              {error.stack}
            </pre>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-700 mb-3">
          This section encountered an error. You can try to reload it or
          continue using other parts of the application.
        </p>
      )}

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetErrorBoundary();
            toast({
              title: "Component reloaded",
              description: "The component has been reset.",
            });
          }}
        >
          Reload
        </Button>
      </div>
    </div>
  );
};

export default ErrorFallback;
