import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Package,
  CreditCard,
  IndianRupee,
  Loader2,
  XCircle,
  ClipboardList,
} from "lucide-react";

import { useDoctorSession } from "./dashboard-hooks/useDoctorSession";
import { useDarkMode } from "./dashboard-hooks/useDarkMode";
import LoginScreen from "./dashboard-components/LoginScreen";

/**
 * ============================================================================
 * PHARMACY DISPENSARY DASHBOARD (Phase 2 Replacement)
 * ============================================================================
 * Replaces the patients-table-based PharmacyDashboard.jsx with a full
 * billing-and-inventory-aware dispensing workflow backed by the new
 * prescriptions / prescription_items / billing_invoices / pharmacy_inventory
 * schema (see phase2-pharmacy-schema.sql).
 *
 * Two tabs:
 *   Queue     — Lists ISSUED prescriptions; pharmacist reviews line items,
 *               sees the invoice total, selects payment method, and fires the
 *               `dispense_prescription` atomic RPC.
 *   Inventory — Full pharmacy_inventory catalogue with low-stock row alerts.
 *
 * NOTE ON SYNTAX: JSX className props use string concatenation (not template
 * literals / backticks) per the strict syntax directive in the spec, to
 * prevent markdown parser issues when this file is reviewed or copied.
 */
export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingSession, logout, profile } =
    useDoctorSession();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // ------------------------------------------------------------------
  // Tab state
  // ------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState("queue");

  // ------------------------------------------------------------------
  // Queue tab state
  // ------------------------------------------------------------------
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [rxLineItems, setRxLineItems] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispenseMessage, setDispenseMessage] = useState({
    type: "",
    text: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // ------------------------------------------------------------------
  // Inventory tab state
  // ------------------------------------------------------------------
  const [inventory, setInventory] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // ------------------------------------------------------------------
  // DATA FETCHING: Pending Queue
  // ------------------------------------------------------------------
  /**
   * Fetches all ISSUED prescriptions, joining patients (name, token) and
   * billing_invoices (grand_total, payment_status) in one relational query.
   * Supabase's embedded resource syntax handles the join server-side so
   * no client-side merging is needed.
   */
  const fetchPendingQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    const { data, error } = await supabase
      .from("prescriptions")
      .select(
        "id, issued_at, notes, status, patient_id, " +
          "patients(name, token_number, age, gender, is_red_flag), " +
          "billing_invoices(grand_total, payment_status)",
      )
      .eq("status", "ISSUED")
      .order("issued_at", { ascending: true });

    setIsLoadingQueue(false);

    if (!error && data) {
      setPendingQueue(data);
    } else if (error) {
      console.error("[Pharmacy] Queue fetch error:", error.message);
    }
  }, []);

  // ------------------------------------------------------------------
  // DATA FETCHING: Prescription Line Items
  // ------------------------------------------------------------------
  /**
   * Loads the line items for whichever prescription is selected, joining
   * pharmacy_inventory to surface the human-readable item_name and the
   * NAMASTE code alongside the clinical fields.
   */
  const fetchRxLineItems = useCallback(async (prescriptionId) => {
    setIsLoadingItems(true);
    const { data, error } = await supabase
      .from("prescription_items")
      .select(
        "id, dosage, frequency, duration_days, quantity_to_dispense, " +
          "pharmacy_inventory(item_name, namaste_code, unit_price, stock_quantity)",
      )
      .eq("prescription_id", prescriptionId);

    setIsLoadingItems(false);

    if (!error && data) {
      setRxLineItems(data);
    } else {
      console.error("[Pharmacy] Line items fetch error:", error?.message);
      setRxLineItems([]);
    }
  }, []);

  // ------------------------------------------------------------------
  // DATA FETCHING: Inventory
  // ------------------------------------------------------------------
  const fetchInventory = useCallback(async () => {
    setIsLoadingInventory(true);
    const { data, error } = await supabase
      .from("pharmacy_inventory")
      .select(
        "id, item_name, namaste_code, category, unit_price, stock_quantity, low_stock_threshold",
      )
      .eq("is_active", true)
      .order("item_name", { ascending: true });

    setIsLoadingInventory(false);
    if (!error && data) setInventory(data);
  }, []);

  // ------------------------------------------------------------------
  // EFFECTS: initial load + real-time subscription
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPendingQueue();
    fetchInventory();
  }, [isAuthenticated, fetchPendingQueue, fetchInventory]);

  // Subscribe to prescription status changes so the queue updates in
  // real-time across multiple workstations without a manual refresh.
  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("pharmacy:prescriptions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prescriptions" },
        () => fetchPendingQueue(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [isAuthenticated, fetchPendingQueue]);

  // ------------------------------------------------------------------
  // SELECTION HANDLER
  // ------------------------------------------------------------------
  const handleSelectRx = (rx) => {
    setSelectedRx(rx);
    setRxLineItems([]);
    setDispenseMessage({ type: "", text: "" });
    setPaymentMethod("CASH");
    fetchRxLineItems(rx.id);

    // Log audit view via the Milestone 0 read-audit function.
    if (rx.patient_id) {
      supabase
        .rpc("log_patient_view", { p_patient_id: rx.patient_id })
        .then(() => {})
        .catch(() => {});
    }
  };

  // ------------------------------------------------------------------
  // DISPENSE ACTION — calls the atomic PostgreSQL RPC
  // ------------------------------------------------------------------
  /**
   * The RPC runs steps a–g in a single transaction server-side:
   *   a) validate prescription is ISSUED
   *   b) validate stock sufficiency for all line items
   *   c) decrement stock
   *   d) mark prescription DISPENSED
   *   e) mark invoice PAID
   *   f) advance patients.status to "Dispensed"
   *   g) insert into prescription_dispensing audit table
   *
   * If any step fails, the entire transaction rolls back. The RPC
   * returns a jsonb result with { success, error?, item_name?,
   * available?, required? } so we can show a meaningful error without
   * relying on a generic Postgres exception message.
   */
  const handleDispense = async () => {
    if (!selectedRx?.id || !profile?.id) return;

    setIsProcessing(true);
    setDispenseMessage({ type: "", text: "" });

    const { data, error } = await supabase.rpc("dispense_prescription", {
      p_prescription_id: selectedRx.id,
      p_payment_method: paymentMethod,
    });

    setIsProcessing(false);

    if (error) {
      // Supabase-level error (network, auth, etc.) — not a business logic error
      setDispenseMessage({
        type: "error",
        text: "Network error: " + error.message,
      });
      return;
    }

    if (!data.success) {
      // Business logic error from inside the RPC
      if (data.error === "INSUFFICIENT_STOCK") {
        setDispenseMessage({
          type: "error",
          text:
            "Insufficient stock for " +
            data.item_name +
            " — available: " +
            data.available +
            ", required: " +
            data.required,
        });
      } else if (data.error === "PRESCRIPTION_NOT_FOUND_OR_ALREADY_DISPENSED") {
        setDispenseMessage({
          type: "error",
          text: "Prescription not found or already dispensed.",
        });
      } else {
        setDispenseMessage({
          type: "error",
          text: "Transaction failed: " + (data.detail || data.error),
        });
      }
      return;
    }

    // Success — remove from local queue state immediately (real-time
    // subscription will also fire, but this gives instant feedback)
    setPendingQueue((prev) => prev.filter((rx) => rx.id !== selectedRx.id));
    setSelectedRx(null);
    setRxLineItems([]);
    setDispenseMessage({
      type: "success",
      text: "Dispensed & logged successfully. Inventory updated.",
    });

    // Refresh inventory in the background so stock counts stay accurate.
    fetchInventory();

    setTimeout(() => setDispenseMessage({ type: "", text: "" }), 4000);
  };

  // ------------------------------------------------------------------
  // EARLY RETURNS
  // ------------------------------------------------------------------
  if (isLoadingSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Loading workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onBackHome={() => navigate("/")} />;
  }

  // ------------------------------------------------------------------
  // DERIVED VALUES
  // ------------------------------------------------------------------
  // Calculate the per-prescription line total for the right pane,
  // as a cross-check against the invoice's grand_total.
  const lineTotal = rxLineItems.reduce((sum, item) => {
    const price = item.pharmacy_inventory?.unit_price ?? 0;
    const qty = item.quantity_to_dispense ?? 0;
    return sum + price * qty;
  }, 0);

  const invoiceTotal =
    selectedRx?.billing_invoices?.[0]?.grand_total ?? lineTotal * 1.05; // 5% GST fallback

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="h-screen w-full overflow-hidden bg-gray-100 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors duration-200 flex flex-col">
      <div className="mx-auto w-full flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* ---- HEADER ---- */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm gap-3 transition-colors duration-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Pill
                className="text-blue-500 flex-shrink-0"
                aria-hidden="true"
              />
              MediKiosk Pharmacy Dispensary
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Secure e-Prescription fulfillment and dispensing log.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab switcher in the header so it's always accessible */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-bold transition " +
                  (activeTab === "queue"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400")
                }
              >
                <ClipboardList size={13} aria-hidden="true" />
                Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-bold transition " +
                  (activeTab === "inventory"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-slate-400")
                }
              >
                <Package size={13} aria-hidden="true" />
                Inventory
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                fetchPendingQueue();
                fetchInventory();
              }}
              title="Force sync"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              {isDarkMode ? (
                <Sun size={16} aria-hidden="true" />
              ) : (
                <Moon size={16} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Lock session"
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg transition"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ================================================================
            TAB: DISPENSE QUEUE
        ================================================================ */}
        {activeTab === "queue" && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
            {/* ---- LEFT: Pending Prescriptions List ---- */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                  <FileText
                    size={16}
                    className="text-blue-500"
                    aria-hidden="true"
                  />
                  Approved Prescriptions
                </h2>
                <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                  {pendingQueue.length} Pending
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoadingQueue ? (
                  <div className="flex items-center justify-center p-8 gap-2 text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Loading queue...</span>
                  </div>
                ) : pendingQueue.length === 0 ? (
                  <div className="text-center p-8 text-sm text-gray-500 dark:text-slate-400">
                    No approved prescriptions waiting for fulfillment.
                  </div>
                ) : (
                  pendingQueue.map((rx) => (
                    <button
                      key={rx.id}
                      type="button"
                      onClick={() => handleSelectRx(rx)}
                      className={
                        "w-full text-left p-4 rounded-xl border transition-all " +
                        (selectedRx?.id === rx.id
                          ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30"
                          : "bg-white border-gray-100 hover:border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600")
                      }
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                          {rx.patients?.name || "Unknown"}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded flex-shrink-0 ml-2">
                          {rx.patients?.token_number || "—"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {new Date(rx.issued_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {rx.billing_invoices?.[0]?.grand_total && (
                          <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-400">
                            {"₹" +
                              Number(
                                rx.billing_invoices[0].grand_total,
                              ).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {rx.patients?.is_red_flag && (
                        <div className="mt-2 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle size={11} aria-hidden="true" /> Urgent
                          Fulfillment
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ---- RIGHT: Prescription Detail & Dispense Panel ---- */}
            <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
              {!selectedRx ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 p-8 text-center">
                  <Pill
                    size={48}
                    className="mb-4 opacity-20"
                    aria-hidden="true"
                  />
                  <p className="text-lg font-bold">No Prescription Selected</p>
                  <p className="text-sm mt-2 max-w-sm">
                    Select a patient from the approved queue to review and
                    dispense their medications.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Patient header */}
                  <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">
                          {selectedRx.patients?.name}
                        </h2>
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {selectedRx.patients?.token_number || "TKN-PENDING"}
                        </span>
                        {selectedRx.patients?.is_red_flag && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} aria-hidden="true" />{" "}
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {selectedRx.patients?.age} Yrs •{" "}
                        {selectedRx.patients?.gender}
                      </p>
                    </div>
                  </div>

                  {/* Medication line items */}
                  <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                      <Pill
                        size={15}
                        className="text-blue-500"
                        aria-hidden="true"
                      />
                      Medications to Dispense
                    </h3>

                    {isLoadingItems ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm p-4">
                        <Loader2 size={16} className="animate-spin" />
                        Loading items...
                      </div>
                    ) : rxLineItems.length === 0 ? (
                      <div className="p-5 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center text-sm text-gray-400 dark:text-slate-500 italic">
                        No medication items found for this prescription.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rxLineItems.map((item, idx) => {
                          const inv = item.pharmacy_inventory || {};
                          const isLow = inv.stock_quantity <= 50;
                          return (
                            <div
                              key={item.id || idx}
                              className={
                                "p-4 border rounded-xl flex flex-col sm:flex-row justify-between gap-3 " +
                                (isLow
                                  ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/5"
                                  : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800")
                              }
                            >
                              <div className="flex-1">
                                <div className="flex items-start gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 dark:text-white text-base">
                                    {inv.item_name || "Unknown Item"}
                                  </span>
                                  {inv.namaste_code && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                      {inv.namaste_code}
                                    </span>
                                  )}
                                  {isLow && (
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                                      <AlertTriangle
                                        size={10}
                                        aria-hidden="true"
                                      />
                                      Low Stock ({inv.stock_quantity} left)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 space-x-3">
                                  {item.dosage && (
                                    <span>Dose: {item.dosage}</span>
                                  )}
                                  {item.frequency && (
                                    <span>Freq: {item.frequency}</span>
                                  )}
                                  {item.duration_days && (
                                    <span>
                                      {item.duration_days}{" "}
                                      {item.duration_days === 1
                                        ? "Day"
                                        : "Days"}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end justify-between gap-1 shrink-0">
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-1 rounded-lg">
                                  {item.quantity_to_dispense} Units
                                </span>
                                {inv.unit_price != null && (
                                  <span className="text-xs text-gray-400 dark:text-slate-500">
                                    {"₹" +
                                      Number(inv.unit_price).toFixed(2) +
                                      " / unit"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ---- Invoice Summary ---- */}
                    <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee size={12} aria-hidden="true" />
                        Invoice Summary
                      </h4>
                      <div className="flex justify-between text-sm text-gray-700 dark:text-slate-300">
                        <span>Subtotal (medications)</span>
                        <span className="font-bold">
                          {"₹" + lineTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                        <span>GST (5% — Ayush formulations)</span>
                        <span>
                          {"₹" + (invoiceTotal - lineTotal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-black text-emerald-800 dark:text-emerald-300 border-t border-emerald-200 dark:border-emerald-500/20 pt-2">
                        <span>Total to Collect</span>
                        <span>{"₹" + Number(invoiceTotal).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Physician notes if present */}
                    {selectedRx.notes && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-slate-300">
                        <strong className="block text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-2 tracking-wider">
                          Physician Notes
                        </strong>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {selectedRx.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ---- Dispense Action Bar ---- */}
                  <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                    {/* Payment method selector */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                        <CreditCard size={13} aria-hidden="true" />
                        Payment Method:
                      </span>
                      {["CASH", "UPI", "WAIVED"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={
                            "text-xs px-3 py-1.5 rounded-lg font-bold border transition " +
                            (paymentMethod === method
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:border-blue-400")
                          }
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Feedback message */}
                      <div className="text-sm font-bold flex items-center gap-2 order-2 sm:order-1">
                        {dispenseMessage.type === "success" && (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 size={16} aria-hidden="true" />
                            {dispenseMessage.text}
                          </span>
                        )}
                        {dispenseMessage.type === "error" && (
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <XCircle size={16} aria-hidden="true" />
                            {dispenseMessage.text}
                          </span>
                        )}
                      </div>

                      {/* Dispense button */}
                      <button
                        type="button"
                        onClick={handleDispense}
                        disabled={isProcessing || rxLineItems.length === 0}
                        className="order-1 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md transition"
                      >
                        {isProcessing ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 size={18} aria-hidden="true" />
                        )}
                        {isProcessing
                          ? "Processing..."
                          : "Collect Payment & Dispense"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB: INVENTORY
        ================================================================ */}
        {activeTab === "inventory" && (
          <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                <Package
                  size={16}
                  className="text-blue-500"
                  aria-hidden="true"
                />
                Pharmacy Inventory
              </h2>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Rows highlighted in amber have stock below threshold.
              </span>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoadingInventory ? (
                <div className="flex items-center justify-center p-12 gap-2 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Loading inventory...</span>
                </div>
              ) : inventory.length === 0 ? (
                <div className="text-center p-12 text-sm text-gray-500 dark:text-slate-400">
                  No active inventory items found.
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      {[
                        "Item Name",
                        "Category",
                        "NAMASTE Code",
                        "Unit Price",
                        "Current Stock",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="text-left py-3 px-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLow =
                        item.stock_quantity <= item.low_stock_threshold;
                      return (
                        <tr
                          key={item.id}
                          className={
                            "border-b border-gray-100 dark:border-slate-800 transition-colors " +
                            (isLow
                              ? "bg-amber-50 dark:bg-amber-500/5"
                              : "hover:bg-gray-50 dark:hover:bg-slate-800/50")
                          }
                        >
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                            {item.item_name}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-slate-400">
                            {item.category || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-slate-500">
                            {item.namaste_code || "—"}
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-slate-300 font-medium">
                            {"₹" + Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  "font-bold " +
                                  (isLow
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-gray-900 dark:text-white")
                                }
                              >
                                {item.stock_quantity}
                              </span>
                              {isLow && (
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded">
                                  <AlertTriangle size={9} aria-hidden="true" />
                                  Low
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
