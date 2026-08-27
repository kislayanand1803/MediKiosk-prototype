import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Activity,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export default function IntakePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [hasConsent, setHasConsent] = useState(false);

  const handleQuickFill = () => {
    setName("Rahul Sharma");
    setAge("28");
    setGender("Male");
    setAbhaId("91-4582-1923-8821");
    setHasConsent(true);
  };

  const startConsultation = (e) => {
    e.preventDefault();
    if (!hasConsent) {
      alert(
        "Please grant DPDP Act consent to proceed with AI clinical history recording.",
      );
      return;
    }
    const patientInfo = { name, age, gender, abhaId };
    navigate("/chat", { state: { patientInfo } });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-full text-blue-600">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-950 tracking-tight">
                MediKiosk
              </h1>
              <p className="text-xs text-gray-500">
                Ayush Clinical Intake & Triage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold transition"
          >
            ⚡ Demo Fill
          </button>
        </div>

        <form onSubmit={startConsultation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Age
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Gender
              </label>
              <div className="relative">
                <Users
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <select
                  required
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              ABHA Number (Optional / ABDM Locker)
            </label>
            <div className="relative">
              <CreditCard
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="e.g. 91-XXXX-XXXX-XXXX"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="dpdpConsent"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="dpdpConsent"
              className="text-[11px] text-gray-600 leading-relaxed cursor-pointer"
            >
              <span className="font-bold text-gray-800 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-600" /> DPDP Act
                2023 & ABDM Consent
              </span>
              I consent to automated clinical history intake, medical document
              OCR, and secure PHR transmission to the physician.
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 text-white font-bold text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
          >
            Begin Clinical Consultation ➔
          </button>
        </form>
      </div>
    </div>
  );
}
