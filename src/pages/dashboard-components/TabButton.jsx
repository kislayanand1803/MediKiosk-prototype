/**
 * Shared pill-style toggle button used for both the top-level
 * Queue/Analytics tabs and the queue's Waiting/In Consult/Completed
 * filters. Consolidates what were five separately hand-written
 * active/inactive class ternaries into one component.
 */
const ACTIVE_TEXT_CLASS = {
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  green: "text-green-600 dark:text-green-400",
};

export default function TabButton({ active, onClick, children, activeColor = "blue", size = "md" }) {
  const sizeClasses =
    size === "sm" ? "flex-1 text-[10px] sm:text-xs py-1.5" : "text-xs px-3 py-1.5";
  const activeClasses = active
    ? `bg-white dark:bg-slate-700 shadow-sm ${ACTIVE_TEXT_CLASS[activeColor]}`
    : "text-gray-600 dark:text-slate-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-bold rounded-md transition ${sizeClasses} ${activeClasses}`}
    >
      {children}
    </button>
  );
}
