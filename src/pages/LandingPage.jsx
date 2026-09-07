import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MetricsBar from "./components/MetricsBar";
import PatientJourney from "./components/PatientJourney";
import TechStack from "./components/TechStack";
import Footer from "./components/Footer";

/**
 * ==========================================
 * LANDING PAGE
 * ==========================================
 * Marketing / pitch page for MediKiosk — Smart India Hackathon 2026,
 * problem statement SIH26047 (Ministry of Ayush). It explains the
 * architecture, the 6-step patient workflow, and provides direct
 * entry points to both the Patient Kiosk and the Vaidya (doctor) Portal.
 *
 * Structure:
 *   - Each visual section is its own component under ./components,
 *     so a section can be reordered, reused, or reviewed independently.
 *   - All copy, stats, and step/card data live in ./data/landingContent.js,
 *     so a content edit never requires touching this file or the
 *     section components themselves.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-green-200">
      <Navbar />
      <Hero />
      <MetricsBar />
      <PatientJourney />
      <TechStack />
      <Footer />
    </div>
  );
}
