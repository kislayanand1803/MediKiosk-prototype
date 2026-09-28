import { TECH_STACK } from "../data/landingContent";

// Updated TONE_CLASSES to include tinted drop shadows and smoother background transitions
const TONE_CLASSES = {
  blue: {
    chip: "bg-blue-100 text-blue-600",
    hover:
      "hover:border-blue-200 hover:bg-blue-50/80 hover:shadow-lg hover:shadow-blue-100/50",
  },
  orange: {
    chip: "bg-orange-100 text-orange-600",
    hover:
      "hover:border-orange-200 hover:bg-orange-50/80 hover:shadow-lg hover:shadow-orange-100/50",
  },
  green: {
    chip: "bg-green-100 text-green-600",
    hover:
      "hover:border-green-200 hover:bg-green-50/80 hover:shadow-lg hover:shadow-green-100/50",
  },
  purple: {
    chip: "bg-purple-100 text-purple-600",
    hover:
      "hover:border-purple-200 hover:bg-purple-50/80 hover:shadow-lg hover:shadow-purple-100/50",
  },
};

function TechCard({ icon: Icon, tone, title, description }) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <div
      className={`group relative border border-gray-100 rounded-3xl p-8 bg-gray-50 hover:-translate-y-1.5 transition-all duration-300 ${toneClasses.hover}`}
    >
      <div
        className={`${toneClasses.chip} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={24} aria-hidden="true" />
      </div>
      <h4 className="text-xl font-bold text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function TechStack() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">
            Architecture
          </h2>
          <h3 className="text-3xl font-extrabold text-gray-900">
            Highly Scalable, Hardware-Agnostic Tech
          </h3>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg">
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
