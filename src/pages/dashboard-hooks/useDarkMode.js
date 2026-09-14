import { useState, useEffect } from "react";

const THEME_STORAGE_KEY = "medikiosk_theme";

/**
 * Persists the dashboard's dark/light preference to localStorage and
 * keeps the <html> element's "dark" class in sync with it, which is
 * what drives every `dark:` Tailwind variant in this app.
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleDarkMode };
}
