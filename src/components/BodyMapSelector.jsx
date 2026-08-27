import { useState } from "react";
import Model from "react-body-highlighter";

export default function BodyMapSelector({ onSelect }) {
  const [selectedParts, setSelectedParts] = useState([]);
  const [isFront, setIsFront] = useState(true);

  const handleClick = (clickEvent) => {
    // The package returns an object. We need to extract the "muscle" string from it.
    const muscleName = clickEvent.muscle;

    if (!muscleName) return;

    // Highlight the clicked part. The package expects this exact data structure.
    setSelectedParts([{ name: "Patient Selection", muscles: [muscleName] }]);

    // Format the text nicely (e.g., "left-shoulder" -> "Left Shoulder")
    const formattedName = muscleName
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Send the selection back to the chat (using setTimeout to allow the highlight to render first)
    setTimeout(() => {
      onSelect(`I feel pain in my ${formattedName}`);
    }, 300);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-medical-200 shadow-sm my-4 flex flex-col items-center">
      <p className="text-sm text-gray-500 font-medium mb-4 text-center">
        Tap the area on the body where you feel discomfort
      </p>

      {/* Front/Back Toggle */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setIsFront(true)}
          className={`px-4 py-1 text-sm rounded-md transition-colors ${isFront ? "bg-white shadow text-medical-700 font-bold" : "text-gray-500"}`}
        >
          Front
        </button>
        <button
          onClick={() => setIsFront(false)}
          className={`px-4 py-1 text-sm rounded-md transition-colors ${!isFront ? "bg-white shadow text-medical-700 font-bold" : "text-gray-500"}`}
        >
          Back
        </button>
      </div>

      {/* The Interactive SVG */}
      <div className="w-full max-w-[250px]">
        <Model
          type={isFront ? "anterior" : "posterior"}
          data={selectedParts}
          highlightedColors={["#2563eb"]} // Tailwind medical-600 blue
          onClick={handleClick}
        />
      </div>
    </div>
  );
}
