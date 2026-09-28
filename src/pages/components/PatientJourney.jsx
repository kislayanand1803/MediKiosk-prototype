import { TIMELINE_STEPS } from "../data/landingContent";

/**
 * Single row in the patient-journey timeline.
 */
function TimelineStep({
  index,
  icon: Icon,
  tone,
  title,
  description,
  highlight,
}) {
  // If highlighted (e.g., the final Pharmacy/Dispensary step), use the orange treatment.
  const dotClasses = highlight ? "bg-orange-500" : "bg-green-600";
  const cardClasses = highlight
    ? "border-2 border-orange-200 bg-orange-50/80"
    : "bg-white border border-gray-100";
  const titleClasses = highlight ? "text-orange-900" : "text-gray-900";
  const bodyClasses = highlight ? "text-orange-800" : "text-gray-600";
  const iconClasses = tone === "orange" ? "text-orange-500" : "text-green-600";

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
      {/* Numbered marker on the timeline spine */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${dotClasses} text-white font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110`}
        aria-hidden="true"
      >
        {index}
      </div>

      {/* Step content card with hover lift */}
      <div
        className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${cardClasses}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <Icon className={iconClasses} size={22} aria-hidden="true" />
          <h4 className={`font-bold text-lg ${titleClasses}`}>{title}</h4>
        </div>
        <p className={`text-sm leading-relaxed ${bodyClasses}`}>
          {description}
        </p>
      </div>
    </div>
  );
}

export default function PatientJourney() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-orange-600 tracking-widest uppercase mb-2">
            End-to-End Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-gray-900">
            From Walk-In to Wellness in Minutes
          </h3>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            A frictionless, voice-first triage workflow that connects
            low-literacy patients directly to the Vaidya, culminating in a smart
            pharmacy checkout.
          </p>
        </div>

        {/* Timeline Spine */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-green-200 before:via-orange-200 before:to-green-200">
          {TIMELINE_STEPS.map((step, index) => (
            <TimelineStep key={step.title} index={index + 1} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
