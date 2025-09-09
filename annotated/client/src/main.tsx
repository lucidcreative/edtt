// React application entry point - bootstraps the entire frontend application
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeSentry } from "./lib/sentry";

// Initialize Sentry error tracking before rendering the app to catch all errors
initializeSentry();

// Create React root and render the main App component to the DOM element with id "root"
createRoot(document.getElementById("root")!).render(<App />);