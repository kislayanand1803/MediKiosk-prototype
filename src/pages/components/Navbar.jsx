import { useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { NAV_LINKS } from "../data/landingContent";

/**
 * Top navigation bar for the marketing site.
 * Includes mobile-responsive fixes: hides tagline on small screens
 * and uses whitespace-nowrap to prevent button text from wrapping.
 * Expanded to max-w-[90rem] for ultrawide monitor support.
 */
export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      {/* Expanded max-width and aligned padding to match the footer */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between h-16 items-center">
          {/* Brand mark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg">
              <Leaf
                className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-lg sm:text-xl text-green-900 tracking-tight leading-none">
                MediKiosk
              </span>
              {/* Tagline hidden on extra-small mobile screens to save space */}
              <span className="hidden sm:block text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-wide">
                Empowering Ayush Healthcare
              </span>
            </div>
          </div>

          {/* Primary entry points */}
          <div className="flex gap-3 sm:gap-4 items-center shrink-0">
            {NAV_LINKS.map(({ label, path, variant }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={
                  variant === "solid"
                    ? "whitespace-nowrap text-xs sm:text-sm font-bold bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow hover:bg-green-700 hover:shadow-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                    : "whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-600 hover:text-green-700 transition rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
