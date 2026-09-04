import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Activity,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  Stethoscope,
  Globe,
} from "lucide-react";
import { LANGUAGES, getT } from "../utils/translations";

export default function IntakePage() {
  const navigate = useNavigate();
  const [appLanguage, setAppLanguage] = useState("en");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [hasConsent, setHasConsent] = useState(false);

  const t = getT(appLanguage);

  const handleQuickFill = () => {
    setName("Nahar Singh Negi");
    setAge("21");
    setGender("Female");
    setAbhaId("91-4582-1923-8821");
    setHasConsent(true);
  };

  const startConsultation = (e) => {
    e.preventDefault();
    if (!hasConsent) {
      alert(t.alert);
      return;
    }
    const patientInfo = { name, age, gender, abhaId };
    navigate("/chat", { state: { patientInfo, appLanguage } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-4 bg-blue-50 relative">
      {/* NEW: Back to Home Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-blue-700 font-medium transition-colors bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-200 z-10 text-xs sm:text-sm"
      >
        <ArrowLeft size={16} />
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      <div className="absolute top-4 right-4">
        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-blue-50 transition px-3 py-1.5 cursor-pointer">
          <Globe size={16} className="text-blue-700 mr-2" />
          <select
            value={appLanguage}
            onChange={(e) => setAppLanguage(e.target.value)}
            className="bg-transparent text-blue-700 text-xs font-bold outline-none cursor-pointer appearance-none pr-4"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-white shadow-xl rounded-2xl border border-gray-100 mt-10 sm:mt-0">
        <div className="flex justify-between items-center mb-6 gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
              <Activity size={28} />
            </div>
            <div className="truncate">
              <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight truncate">
                {t.title}
              </h1>
              <p className="text-xs text-gray-500 truncate">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded font-semibold transition flex-shrink-0"
          >
            {t.demo}
          </button>
        </div>

        <form onSubmit={startConsultation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              {t.name}
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
                placeholder={t.nameP}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                {t.age}
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
                  placeholder={t.ageP}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                {t.gender}
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
                    {t.select}
                  </option>
                  <option value="Male">{t.male}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              {t.abha}
            </label>
            <div className="relative">
              <CreditCard
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder={t.abhaP}
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
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
            />
            <label
              htmlFor="dpdpConsent"
              className="text-[11px] text-gray-600 leading-relaxed cursor-pointer"
            >
              <span className="font-bold text-gray-800 flex items-center gap-1 flex-wrap">
                <ShieldCheck
                  size={14}
                  className="text-blue-600 flex-shrink-0"
                />{" "}
                DPDP Act 2023 & ABDM Consent
              </span>
              {t.consent}
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 text-white font-bold text-sm bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
          >
            {t.btn}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={() => navigate("/doctor")}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-2"
          >
            <Stethoscope size={15} className="text-blue-400" /> {t.docBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
