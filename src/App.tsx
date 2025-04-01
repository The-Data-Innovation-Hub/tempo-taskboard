import React, { Suspense, lazy, useEffect } from "react";
import UserDetails from "./pages/user/[id]";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import Home from "./components/home";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AuthGuard from "./components/layout/AuthGuard";
import { useAuth } from "./lib/auth";
import { ToastProvider } from "./components/ui/toast";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import routes from "tempo-routes";
import { store } from "./lib/redux-store";
import { DragDropContext } from "react-beautiful-dnd";
import OrganisationDetails from "./pages/organization/[id]";
import Users from "./pages/users";
import ProfilePage from "./pages/ProfilePage";
import SupabaseConfigCheck from "./components/SupabaseConfigCheck";

// Lazy load pages to improve initial load performance
const ProjectPage = lazy(() => import("./pages/project/[id]"));
const ProjectsPage = lazy(() => import("./pages/projects"));
const TeamPage = lazy(() => import("./pages/team"));
const OrganizationPage = lazy(() => import("./pages/organization"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const HelpPage = lazy(() => import("./pages/help"));

// Error boundary component for production use
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  {
    hasError: boolean;
    errorMessage: string;
    errorStack: string;
    componentStack: string;
  }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
      errorStack: "",
      componentStack: "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error.message || "An unknown error occurred",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture detailed error information
    this.setState({
      errorStack: error.stack || "",
      componentStack: errorInfo.componentStack || "",
    });

    // Log error in development
    if (import.meta.env.DEV) {
      console.error("Uncaught error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // In production, log minimal information to console but send detailed info to an error tracking service
    if (import.meta.env.PROD) {
      console.error(`Production error: ${error.message}`);

      // Send to error tracking service if available
      this.logErrorToService(error, errorInfo);

      // You could also send to your own API endpoint
      // this.logErrorToAPI(error, errorInfo);
    }
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Integration with error tracking services like Sentry would go here
    // Example (commented out as it's not actually implemented):
    // if (typeof window.Sentry !== 'undefined') {
    //   window.Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }

    // For now, we'll just log to console in a structured way
    if (import.meta.env.PROD) {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      console.error("PRODUCTION ERROR REPORT:", JSON.stringify(errorData));
    }
  }

  render() {
    if (this.state.hasError) {
      // Show a more detailed error in development
      if (import.meta.env.DEV) {
        return (
          <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-lg max-w-2xl w-full overflow-auto">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Something went wrong
              </h2>
              <p className="text-gray-700 mb-4">{this.state.errorMessage}</p>
              {this.state.errorStack && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Error Stack:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    {this.state.errorStack}
                  </pre>
                </div>
              )}
              {this.state.componentStack && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Component Stack:
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    {this.state.componentStack}
                  </pre>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-[#0089AD] text-white rounded hover:bg-[#006d8a] transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // Show a user-friendly error in production
      return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-6">
              We're sorry, but an error occurred. Our team has been notified and
              is working on a fix.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-[#0089AD] text-white rounded hover:bg-[#006d8a] transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full py-2 px-4 border border-[#0089AD] text-[#0089AD] rounded hover:bg-gray-50 transition-colors"
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { isAuthenticated, refreshSession } = useAuth();
  const { toast } = useToast();

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled Promise Rejection:", event.reason);

      // In production, show a toast notification
      if (import.meta.env.PROD) {
        toast({
          title: "An error occurred",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      }

      // Prevent the default browser behavior which would log to console
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [toast]);

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error("Failed to refresh authentication session:", error);
        // Show a toast notification in production
        if (import.meta.env.PROD) {
          toast({
            title: "Authentication Error",
            description: "Failed to restore your session. Please log in again.",
            variant: "destructive",
          });
        }
      }
    };

    initializeAuth();

    // Skip auth listener to avoid errors
    return () => {};
  }, [refreshSession, toast]);

  // Dummy onDragEnd function for the global DragDropContext
  const onDragEnd = () => {
    // This is intentionally empty as each component will handle its own drag end
  };

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <DragDropContext onDragEnd={onDragEnd}>
          <ToastProvider>
            <div className="app-container">
              {isAuthenticated && <Sidebar />}
              <div
                className={
                  isAuthenticated ? "content-container pt-16" : "w-full"
                }
              >
                {isAuthenticated && <Header />}
                <Suspense
                  fallback={
                    <div className="loading-container flex items-center justify-center h-screen">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
                    </div>
                  }
                >
                  <>
                    {/* Tempo routes - must be before regular routes */}
                    {import.meta.env.VITE_TEMPO && useRoutes(routes)}

                    <Routes>
                      {/* Public routes */}
                      <Route path="/landing" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />

                      {/* Protected routes */}
                      {/* Dashboard route (protected) */}
                      <Route
                        path="/dashboard"
                        element={
                          <AuthGuard>
                            <Home />
                          </AuthGuard>
                        }
                      />

                      {/* Projects route */}
                      <Route
                        path="/projects"
                        element={
                          <AuthGuard>
                            <ProjectsPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="projects"
                        element={
                          <AuthGuard>
                            <ProjectsPage />
                          </AuthGuard>
                        }
                      />

                      {/* Admin-only routes */}
                      <Route
                        path="/project"
                        element={
                          <AuthGuard>
                            <ProjectsPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="project"
                        element={
                          <AuthGuard>
                            <ProjectsPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/project/:id"
                        element={
                          <AuthGuard>
                            <ProjectPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="project/:id"
                        element={
                          <AuthGuard>
                            <ProjectPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/team"
                        element={
                          <AuthGuard requireAdmin>
                            <TeamPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/organization"
                        element={
                          <AuthGuard requireAdmin>
                            <OrganizationPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/organization/:id"
                        element={
                          <AuthGuard>
                            <OrganisationDetails />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <AuthGuard requireAdmin>
                            <Users />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/users/:id"
                        element={
                          <AuthGuard requireAdmin>
                            <Suspense
                              fallback={
                                <div className="loading-container flex items-center justify-center h-screen">
                                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
                                </div>
                              }
                            >
                              <UserDetails />
                            </Suspense>
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/users/:id/edit"
                        element={
                          <AuthGuard requireAdmin>
                            <Suspense
                              fallback={
                                <div className="loading-container flex items-center justify-center h-screen">
                                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
                                </div>
                              }
                            >
                              {/* Lazy load the edit page */}
                              {React.createElement(
                                lazy(() => import("./pages/user/edit/[id]")),
                              )}
                            </Suspense>
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <AuthGuard>
                            <ProfilePage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/help"
                        element={
                          <AuthGuard>
                            <HelpPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/performance"
                        element={
                          <AuthGuard>
                            <Suspense
                              fallback={
                                <div className="loading-container flex items-center justify-center h-screen">
                                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
                                </div>
                              }
                            >
                              {React.createElement(
                                lazy(() => import("./pages/performance")),
                              )}
                            </Suspense>
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/supabase-config"
                        element={
                          <AuthGuard requireAdmin>
                            <div className="p-8 bg-gray-100 min-h-screen">
                              <SupabaseConfigCheck />
                            </div>
                          </AuthGuard>
                        }
                      />

                      {/* Tempo routes */}
                      {import.meta.env.VITE_TEMPO && (
                        <Route path="/tempobook/*" />
                      )}

                      {/* Redirect to dashboard if authenticated, otherwise show landing page */}
                      <Route
                        path="/"
                        element={isAuthenticated ? <Home /> : <LandingPage />}
                      />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </>
                </Suspense>
              </div>
              <Toaster />
            </div>
          </ToastProvider>
        </DragDropContext>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
