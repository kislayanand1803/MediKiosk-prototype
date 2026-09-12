import { TECH_STACK } from "../data/landingContent";

// Per-tone classes for the icon chip and hover treatment on each tech card.
// Kept as a lookup (not built from a template string) so Tailwind's
// build-time scanner can see every class literally and won't purge it.
const TONE_CLASSES = {
  blue: {
    chip: "bg-blue-100",
    icon: "text-blue-600",
    hover: "hover:border-blue-300 hover:bg-blue-50/30",
  },
  orange: {
    chip: "bg-orange-100",
    icon: "text-orange-600",
    hover: "hover:border-orange-300 hover:bg-orange-50/30",
  },
  green: {
    chip: "bg-green-100",
    icon: "text-green-600",
    hover: "hover:border-green-300 hover:bg-green-50/30",
  },
  purple: {
    chip: "bg-purple-100",
    icon: "text-purple-600",
    hover: "hover:border-purple-300 hover:bg-purple-50/30",
  },
};

function TechCard({ icon: Icon, tone, title, description }) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <div
      className={`border border-gray-100 rounded-3xl p-8 bg-gray-50 transition-colors ${toneClasses.hover}`}
    >
      <div
        className={`${toneClasses.chip} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}
      >
        <Icon className={toneClasses.icon} aria-hidden="true" />
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

/**
 * Architecture / tech-stack showcase. Cards are generated from
 * TECH_STACK so the stack story can be updated (e.g. swapping
 * Supabase for another provider) without touching this layout.
 */
export default function TechStack() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">
            Architecture
          </h2>
          <h3 className="text-3xl font-extrabold text-gray-900">
            Highly Scalable, Hardware-Agnostic Tech
          </h3>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Unlike local LLMs that require expensive GPUs in every clinic,
            MediKiosk uses a modern cloud architecture designed for mass
            deployment in resource-constrained public hospitals and Ayush
            institutions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TECH_STACK.map((card) => (
            <TechCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
