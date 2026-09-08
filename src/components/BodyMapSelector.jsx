import { useState } from "react";
import Model from "react-body-highlighter";
import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* Main Body Map Component */
export default function BodyMapSelector({ onSelect }) {
  /* State Variables */
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isFront, setIsFront] = useState(true);

  // NEW: Object to store the specific side (left/right/both) for EACH selected muscle
  // Example state: { chest: "Both", calves: "Left", biceps: "Right" }
  const [lateralities, setLateralities] = useState({});

  /* Muscle Click & Toggle Handler */
  const handleClick = (clickEvent) => {
    const muscleName = clickEvent.muscle;
    if (!muscleName) return;

    setSelectedMuscles((prev) => {
      if (prev.includes(muscleName)) {
        // If removing the muscle, also clean up its laterality state
        setLateralities((prevLat) => {
          const newLat = { ...prevLat };
          delete newLat[muscleName];
          return newLat;
        });
        return prev.filter((m) => m !== muscleName);
      } else {
        // If adding a new muscle, default it to "Both / Center"
        setLateralities((prevLat) => ({ ...prevLat, [muscleName]: "Both" }));
        return [...prev, muscleName];
      }
    });
  };

  /* Remove a specific muscle directly from the list */
  const removeMuscle = (muscleName) => {
    setSelectedMuscles((prev) => prev.filter((m) => m !== muscleName));
    setLateralities((prevLat) => {
      const newLat = { ...prevLat };
      delete newLat[muscleName];
      return newLat;
    });
  };

  /* Update the side for a specific muscle */
  const updateLaterality = (muscleName, side) => {
    setLateralities((prev) => ({ ...prev, [muscleName]: side }));
  };

  /* Confirmation Action Code */
  const handleConfirm = () => {
    if (selectedMuscles.length === 0) return;

    // Combine the Side and the Muscle Name into a clinical array
    // e.g., "Left Biceps", "Right Calves", "Chest"
    const detailedSelections = selectedMuscles.map((m) => {
      const friendlyName = m
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const side = lateralities[m];

      if (side === "Both" || side === "Center") {
        return friendlyName; // Just say "Chest" instead of "Both Chest"
      }
      return `${side} ${friendlyName}`; // Say "Left Biceps"
    });

    // Natural Language Grammar Formatter (handles commas and "and")
    let partsString = "";
    if (detailedSelections.length === 1) {
      partsString = detailedSelections[0];
    } else if (detailedSelections.length === 2) {
      partsString = detailedSelections.join(" and ");
    } else {
      partsString =
        detailedSelections.slice(0, -1).join(", ") +
        ", and " +
        detailedSelections[detailedSelections.length - 1];
    }

    // Sends the highly specific clinical sentence to the AI
    onSelect(`I am experiencing discomfort in my ${partsString}.`);
  };

  /* Data Formatter for react-body-highlighter */
  const mapData = [
    {
      name: "Patient Selection",
      muscles: selectedMuscles,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Front/Back Orientation Toggle */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl w-full max-w-[200px] shadow-inner">
        <button
          onClick={() => setIsFront(true)}
          className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
            isFront
              ? "bg-white shadow-sm text-[#1d6b54] font-bold"
              : "text-slate-500 hover:text-slate-700 font-medium"
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setIsFront(false)}
          className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${
            !isFront
              ? "bg-white shadow-sm text-[#1d6b54] font-bold"
              : "text-slate-500 hover:text-slate-700 font-medium"
          }`}
        >
          Back
        </button>
      </div>

      {/* SVG Interactive Body Model Render */}
      <div className="w-full max-w-[180px] transition-opacity duration-300 relative z-10 mb-2">
        <Model
          type={isFront ? "anterior" : "posterior"}
          data={mapData}
          highlightedColors={["#cd6b40"]}
          onClick={handleClick}
        />
      </div>

      {/* NEW: Per-Muscle Laterality List */}
      <div className="w-full max-h-[200px] overflow-y-auto scrollbar-thin pr-1 mt-2 space-y-2">
        <AnimatePresence>
          {selectedMuscles.map((muscle) => (
            <motion.div
              key={muscle}
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 capitalize">
                  {muscle.replace(/-/g, " ")}
                </span>
                <button
                  onClick={() => removeMuscle(muscle)}
                  className="text-slate-400 hover:text-red-500 transition-colors bg-white rounded-md border border-slate-200 p-0.5"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Individual Left/Both/Right Toggle for this specific muscle */}
              <div className="flex gap-1.5 w-full">
                {["Left", "Both", "Right"].map((side) => (
                  <button
                    key={side}
                    onClick={() => updateLaterality(muscle, side)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                      lateralities[muscle] === side
                        ? "bg-[#1a4f43] text-white shadow-sm"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-[#1a4f43] hover:text-[#1a4f43]"
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Final Submission Button */}
      <div className="mt-4 w-full pt-2 border-t border-slate-100">
        <button
          onClick={handleConfirm}
          disabled={selectedMuscles.length === 0}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-all ${
            selectedMuscles.length > 0
              ? "bg-[#1d6b54] hover:bg-[#155440] text-white shadow-lg hover:-translate-y-0.5 active:scale-95 focus:ring-4 focus:ring-[#1d6b54]/40"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <CheckCircle2 size={18} />
          Confirm Selection{" "}
          {selectedMuscles.length > 0 && `(${selectedMuscles.length})`}
        </button>
      </div>
    </div>
  );
}
