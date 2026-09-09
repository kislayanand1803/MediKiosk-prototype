import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  Stethoscope,
  Globe,
  Bot,
  CheckCircle2,
  Lock,
  Activity,
  Zap,
} from "lucide-react";
import { LANGUAGES } from "../utils/translations";

export default function IntakePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [abhaId, setAbhaId] = useState("");
  const [hasConsent, setHasConsent] = useState(false);

  const handleQuickFill = () => {
    setName("Prachi Sharma");
    setAge("20");
    setGender("Female");
    setAbhaId("91-4582-1923-8821");
    setHasConsent(true);
  };

  const startConsultation = (e) => {
    e.preventDefault();
    if (!hasConsent) {
      alert(t("alert"));
      return;
    }
    const patientInfo = { name, age, gender, abhaId };
    navigate("/chat", { state: { patientInfo } });
  };

  return (
    <div className="min-h-screen bg-slate-100 grid place-items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl">
        {/* --- HEADER CONTROLS --- */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-[#0f3c31] font-bold transition-all bg-white px-3 sm:px-4 py-2 rounded-full shadow-sm border border-slate-200 text-xs sm:text-sm hover:shadow-md"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          <div className="flex items-center bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all px-3 sm:px-4 py-2 cursor-pointer">
            <Globe size={16} className="text-[#0f3c31] mr-2 shrink-0" />
            <select
              value={i18n.language?.slice(0, 2) || "en"}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-transparent text-[#0f3c31] text-xs sm:text-sm font-bold outline-none cursor-pointer appearance-none pr-4"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- MAIN SPLIT CARD --- */}
        <div className="bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">
          {/* --- LEFT PANEL: TRUST & STATS --- */}
          <div className="hidden md:flex md:w-5/12 bg-[#0f3c31] p-8 text-white flex-col justify-between relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="bg-[#cd6b40] w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Bot size={28} className="text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
                MediKiosk
              </h1>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-8 max-w-sm">
                {t("subtitle")}
              </p>

              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="p-1.5 border border-emerald-500/30 bg-emerald-800/30 rounded-lg">
                      <ShieldCheck size={14} className="text-emerald-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {t("abdmTitle")}
                    </h3>
                    <p className="text-xs text-emerald-100/60 mt-0.5 leading-relaxed">
                      {t("abdmDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="p-1.5 border border-emerald-500/30 bg-emerald-800/30 rounded-lg">
                      <Lock size={14} className="text-emerald-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {t("dpdpTitle")}
                    </h3>
                    <p className="text-xs text-emerald-100/60 mt-0.5 leading-relaxed">
                      {t("dpdpDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="p-1.5 border border-emerald-500/30 bg-emerald-800/30 rounded-lg">
                      <Activity size={14} className="text-emerald-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {t("ayushTitle")}
                    </h3>
                    <p className="text-xs text-emerald-100/60 mt-0.5 leading-relaxed">
                      {t("ayushDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-10 pt-6 border-t border-emerald-700/50">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-black text-white">
                    1.8{" "}
                    <span className="text-sm font-bold text-emerald-400">
                      m
                    </span>
                  </p>
                  <p className="text-[10px] text-emerald-100/60 uppercase tracking-widest mt-0.5">
                    {t("avgIntake")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">22</p>
                  <p className="text-[10px] text-emerald-100/60 uppercase tracking-widest mt-0.5">
                    {t("languagesStat")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">256</p>
                  <p className="text-[10px] text-emerald-100/60 uppercase tracking-widest mt-0.5">
                    {t("encryption")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT PANEL: REGISTRATION FORM --- */}
          <div className="w-full md:w-7/12 p-6 lg:p-8 bg-white flex flex-col justify-center">
            <div className="md:hidden flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-[#cd6b40] w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                  MediKiosk
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Ayush Clinical Intake
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
                  {t("title")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t("formSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs font-bold text-[#cd6b40] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-orange-100 transition-colors shadow-sm shrink-0"
              >
                <Zap size={14} className="fill-[#cd6b40]" /> {t("demo")}
              </button>
            </div>

            <form onSubmit={startConsultation} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                  {t("name")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f3c31] focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                    placeholder={t("nameP")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                    {t("age")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3.5 top-3 text-slate-400"
                      size={18}
                    />
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f3c31] focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                      placeholder={t("ageP")}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                    {t("gender")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users
                      className="absolute left-3.5 top-3 text-slate-400"
                      size={18}
                    />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f3c31] focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800 appearance-none"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="" disabled className="text-slate-400">
                        {t("select")}
                      </option>
                      <option value="Male">{t("male")}</option>
                      <option value="Female">{t("female")}</option>
                      <option value="Other">{t("other")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                  {t("abha")}{" "}
                  <span className="text-slate-400 font-normal text-[10px] sm:text-xs ml-1">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <CreditCard
                    className="absolute left-3.5 top-3 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f3c31] focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal font-mono tracking-wide"
                    placeholder={t("abhaP")}
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border transition-colors mt-4 ${hasConsent ? "bg-orange-50/70 border-orange-200" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5 mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id="dpdpConsent"
                      checked={hasConsent}
                      onChange={(e) => setHasConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#cd6b40] focus:ring-[#cd6b40] cursor-pointer"
                    />
                  </div>
                  <label
                    htmlFor="dpdpConsent"
                    className="text-[11px] sm:text-xs text-slate-600 cursor-pointer leading-relaxed"
                  >
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5 text-xs sm:text-sm">
                      <CheckCircle2
                        size={16}
                        className={
                          hasConsent ? "text-[#cd6b40]" : "text-slate-400"
                        }
                      />
                      {t("consentTitle")}
                    </span>
                    {t("consent")}
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 text-white font-bold text-sm sm:text-[15px] bg-[#cd6b40] rounded-xl hover:bg-[#b05832] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-[#cd6b40]/30 active:scale-[0.98]"
                >
                  {t("btn")}
                </button>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
                    or
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/doctor")}
                  className="w-full py-3 px-4 bg-[#0f3c31] hover:bg-[#1a4f43] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 focus:ring-4 focus:ring-[#0f3c31]/30 active:scale-[0.98]"
                >
                  <Stethoscope size={16} className="text-emerald-400" />{" "}
                  {t("docBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
