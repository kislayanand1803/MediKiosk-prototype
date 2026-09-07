import { METRICS } from "../data/landingContent";

/**
 * Highlight strip showing the four headline stats below the hero.
 * Rendered from METRICS so adding, removing, or reordering a stat
 * is a data change, not a markup change.
 */
export default function MetricsBar() {
  return (
    <section className="bg-green-900 text-white py-10 border-y-4 border-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-green-700">
          {METRICS.map(({ icon: Icon, value, label }) => (
            <div className="space-y-1" key={label}>
              <Icon
                className="mx-auto h-8 w-8 text-orange-400 mb-2"
                aria-hidden="true"
              />
              <h3 className="text-3xl font-extrabold">{value}</h3>
              <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
