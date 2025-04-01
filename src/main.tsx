import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

// Initialize performance monitoring
import { initPerformanceMonitoring } from "./lib/performance";
initPerformanceMonitoring();

// Install zustand persist middleware
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Add error boundary for production
const renderApp = () => {
  try {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Failed to render application:", error);
    // Render a fallback UI in case of critical error
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: sans-serif;">
          <h2>Something went wrong</h2>
          <p>We're sorry, but the application failed to load. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 20px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
};

renderApp();
