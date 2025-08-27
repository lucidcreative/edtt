import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeSentry } from "./lib/sentry";

// Initialize Sentry before rendering
initializeSentry();

createRoot(document.getElementById("root")!).render(<App />);
