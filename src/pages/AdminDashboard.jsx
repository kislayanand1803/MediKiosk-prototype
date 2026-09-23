import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  Search,
  Power,
  Sun,
  Moon,
  LogOut,
  Stethoscope,
} from "lucide-react";

import { useDoctorSession } from "./dashboard-hooks/useDoctorSession";
import { useDarkMode } from "./dashboard-hooks/useDarkMode";
import LoginScreen from "./dashboard-components/LoginScreen";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout, profile } =
    useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all profiles
  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role", { ascending: true })
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching staff:", error.message);
    } else {
      setStaffList(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated && profile?.role === "admin") {
      fetchStaff();
    }
  }, [isAuthenticated, profile]);

  // Real-time synchronization for profiles table
  useEffect(() => {
    if (!isAuthenticated || profile?.role !== "admin") return;

    const channel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchStaff(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isAuthenticated, profile]);

  // Derived KPI & Coverage Data
  const {
    totalStaff,
    onShiftCount,
    roleCounts,
    physiciansByDept,
    zeroCoverageDepts,
    filteredStaff,
  } = useMemo(() => {
    const total = staffList.length;
    const onShift = staffList.filter((s) => s.on_shift).length;

    const roles = { admin: 0, physician: 0, nurse: 0, pharmacist: 0 };
    staffList.forEach((s) => {
      if (roles[s.role] !== undefined) roles[s.role]++;
    });

    const byDept = {};
    const physicians = staffList.filter((s) => s.role === "physician");

    // Initialize departments found in the system
    physicians.forEach((p) => {
      const dept = p.department || "General";
      if (!byDept[dept])
        byDept[dept] = { total: 0, onShift: 0, activeDoctors: [] };
      byDept[dept].total++;
      if (p.on_shift) {
        byDept[dept].onShift++;
        byDept[dept].activeDoctors.push(p.full_name);
      }
    });

    const zeroDepts = Object.entries(byDept).filter(
      ([_, data]) => data.onShift === 0,
    ).length;

    // Table Filtering
    const filtered = staffList.filter((s) => {
      const matchesSearch =
        (s.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.department || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "All" || s.role === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });

    return {
      totalStaff: total,
      onShiftCount: onShift,
      roleCounts: roles,
      physiciansByDept: byDept,
      zeroCoverageDepts: zeroDepts,
      filteredStaff: filtered,
    };
  }, [staffList, searchQuery, roleFilter]);

  const handleToggleShift = async (staffMember) => {
    const isTurningOff = staffMember.on_shift === true;

    // Guardrail: Prevent silently zeroing out a department
    if (isTurningOff && staffMember.role === "physician") {
      const dept = staffMember.department || "General";
      const activeInDept = physiciansByDept[dept]?.onShift || 0;

      if (activeInDept === 1) {
        const confirm = window.confirm(
          `This is the only physician on shift for ${dept}. Turning them off leaves this department with no coverage. Continue?`,
        );
        if (!confirm) return;
      }
    }

    // Optimistic UI update
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffMember.id ? { ...s, on_shift: !s.on_shift } : s,
      ),
    );

    const { error } = await supabase
      .from("profiles")
      .update({ on_shift: !staffMember.on_shift })
      .eq("id", staffMember.id);

    if (error) {
      console.error("Shift toggle failed:", error.message);
      alert("Failed to update shift status. Check database permissions.");
      fetchStaff(); // Revert on failure
    }
  };

  // Auth & Role Gates
  if (isLoadingSession || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
        Loading Command Center...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <LoginScreen onBackHome={() => navigate("/")} />;
  }
  if (profile?.role !== "admin") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 space-y-4">
        <Shield size={48} className="text-red-500 opacity-50" />
        <h1 className="text-xl font-bold text-white">Unauthorized Access</h1>
        <p>
          Your role ({profile?.role}) does not have administrative privileges.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors duration-200 flex flex-col">
      <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* 1. Header */}
        <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="text-emerald-600 flex-shrink-0" />
              MediKiosk Command Center
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Administrator: {profile.full_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={logout}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {/* 2. Summary KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">
                  Total Staff
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalStaff}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <Activity
                  className="text-emerald-600 dark:text-emerald-400"
                  size={24}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">
                  On-Shift Right Now
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {onShiftCount}
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-colors ${zeroCoverageDepts > 0 ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30" : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"}`}
            >
              <div
                className={`p-3 rounded-lg ${zeroCoverageDepts > 0 ? "bg-red-100 dark:bg-red-500/20" : "bg-slate-100 dark:bg-slate-800"}`}
              >
                <AlertTriangle
                  className={
                    zeroCoverageDepts > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-400"
                  }
                  size={24}
                />
              </div>
              <div>
                <p
                  className={`text-xs font-bold uppercase ${zeroCoverageDepts > 0 ? "text-red-800 dark:text-red-300" : "text-gray-500 dark:text-slate-400"}`}
                >
                  Zero-Coverage Depts
                </p>
                <p
                  className={`text-2xl font-black ${zeroCoverageDepts > 0 ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
                >
                  {zeroCoverageDepts}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">
                Role Breakdown
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm font-medium text-gray-700 dark:text-slate-300">
                <div>Physicians: {roleCounts.physician}</div>
                <div>Nurses: {roleCounts.nurse}</div>
                <div>Pharm: {roleCounts.pharmacist}</div>
                <div>Admins: {roleCounts.admin}</div>
              </div>
            </div>
          </div>

          {/* 3. Department Coverage Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Stethoscope size={18} className="text-emerald-500" /> Clinical
                Department Coverage
              </h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(physiciansByDept).map(([dept, data]) => (
                <div
                  key={dept}
                  className={`p-3 rounded-lg border ${data.onShift === 0 ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/30" : "bg-slate-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {dept}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${data.onShift > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                    >
                      {data.onShift} / {data.total} Active
                    </span>
                  </div>
                  {data.onShift === 0 ? (
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-1 mt-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      No physician on shift for {dept} — incoming patients won't
                      be routed here.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                      {data.activeDoctors.join(", ")}
                    </p>
                  )}
                </div>
              ))}
              {Object.keys(physiciansByDept).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-slate-400 col-span-full py-4 text-center">
                  No physician departments found in the system.
                </p>
              )}
            </div>
          </div>

          {/* 4. Staff Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col flex-1 min-h-[400px]">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-500" /> Staff Roster
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search name or dept..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="All">All Roles</option>
                  <option value="physician">Physicians</option>
                  <option value="nurse">Nurses</option>
                  <option value="pharmacist">Pharmacists</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold border-b border-gray-200 dark:border-slate-700">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 hidden md:table-cell">
                      Qualification / Reg No
                    </th>
                    <th className="p-4 text-center">Shift Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                          {staff.full_name || "Unknown"}
                        </td>
                        <td className="p-4">
                          <span className="capitalize px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-bold">
                            {staff.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-slate-400 font-medium">
                          {staff.role === "physician"
                            ? staff.department || "General"
                            : "—"}
                        </td>
                        <td className="p-4 hidden md:table-cell text-gray-500 dark:text-slate-500 text-xs">
                          {staff.role === "physician" ? (
                            <>
                              <div className="font-bold text-gray-600 dark:text-slate-400">
                                {staff.qualification || "Not listed"}
                              </div>
                              <div>{staff.reg_no || "No Reg No"}</div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleShift(staff)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                              staff.on_shift
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 border border-emerald-200 dark:border-emerald-500/30"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700"
                            }`}
                          >
                            <Power
                              size={14}
                              className={
                                staff.on_shift
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ""
                              }
                            />
                            {staff.on_shift ? "ON SHIFT" : "OFF SHIFT"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-8 text-center text-gray-500 dark:text-slate-400"
                      >
                        No staff members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
