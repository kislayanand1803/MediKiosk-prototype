import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./i18n"; // <-- Boot up the enterprise translation engine before the app loads

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Suspense safely pauses rendering until the required i18n JSON files are downloaded */}
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100 text-[#0f3c31] font-bold animate-pulse">
          Loading MediKiosk...
        </div>
      }
    >
      <App />
    </Suspense>
  </StrictMode>,
);
