import React, { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";

const MedicationPrescriber = ({ onUpdateItems }) => {
  // ============================================================
  // SEARCH STATE
  // ============================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ============================================================
  // CONFIGURATION STATE
  // ============================================================
  const [activeMed, setActiveMed] = useState(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("BID");
  const [duration, setDuration] = useState(5);

  // ============================================================
  // FINAL OUTPUT STATE
  // ============================================================
  const [prescribedItems, setPrescribedItems] = useState([]);

  // ============================================================
  // FREQUENCY MULTIPLIERS
  // ============================================================
  const frequencyMultiplier = {
    OD: 1,
    BID: 2,
    TID: 3,
  };

  // ============================================================
  // CALCULATE REQUIRED QUANTITY
  // ============================================================
  const requiredQuantity =
    frequency && Number(duration) > 0
      ? (frequencyMultiplier[frequency] || 0) * Number(duration)
      : 0;

  // Current available stock
  const availableStock = activeMed ? Number(activeMed.stock_quantity) || 0 : 0;

  // Check whether prescription exceeds available stock
  const exceedsStock = activeMed !== null && requiredQuantity > availableStock;

  // ============================================================
  // SEARCH MEDICATIONS WITH 300ms DEBOUNCE
  // ============================================================
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);

      try {
        const { data, error } = await supabase
          .from("pharmacy_inventory")
          .select("*")
          .ilike("item_name", `%${searchTerm.trim()}%`)
          .eq("is_active", true)
          .limit(5);

        if (error) {
          console.error("Medication search error:", error);
          setSearchResults([]);
          return;
        }

        setSearchResults(data || []);
      } catch (error) {
        console.error("Unexpected medication search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // ============================================================
  // SELECT MEDICATION
  // ============================================================
  const handleSelectMedication = (medication) => {
    // Never allow selection of an out-of-stock medication
    if (Number(medication.stock_quantity) === 0) {
      return;
    }

    setActiveMed(medication);
    setSearchResults([]);
  };

  // ============================================================
  // ADD MEDICATION
  // ============================================================
  const handleAddMedication = () => {
    // Basic validation
    if (!activeMed || !dosage.trim() || !frequency || !duration) {
      return;
    }

    const durationDays = Number(duration);

    if (durationDays <= 0) {
      return;
    }

    const multiplier = frequencyMultiplier[frequency];

    if (!multiplier) {
      return;
    }

    // Safety guard.
    // The button should already be disabled if this is true,
    // but this prevents invalid state updates programmatically.
    if (requiredQuantity > availableStock) {
      return;
    }

    const newMedication = {
      medication_id: activeMed.id,
      item_name: activeMed.item_name,
      namaste_code: activeMed.namaste_code,
      unit_price: activeMed.unit_price,
      dosage: dosage.trim(),
      frequency,
      duration_days: durationDays,
      quantity_to_dispense: requiredQuantity,
    };

    const updatedItems = [...prescribedItems, newMedication];

    setPrescribedItems(updatedItems);

    if (typeof onUpdateItems === "function") {
      onUpdateItems(updatedItems);
    }

    // Reset configuration
    setActiveMed(null);
    setDosage("");
    setFrequency("BID");
    setDuration(5);
    setSearchTerm("");
    setSearchResults([]);
  };

  // ============================================================
  // REMOVE MEDICATION
  // ============================================================
  const handleRemoveItem = (indexToRemove) => {
    const updatedItems = prescribedItems.filter(
      (_, index) => index !== indexToRemove,
    );

    setPrescribedItems(updatedItems);

    if (typeof onUpdateItems === "function") {
      onUpdateItems(updatedItems);
    }
  };

  // ============================================================
  // CANCEL CONFIGURATION
  // ============================================================
  const handleCancelConfiguration = () => {
    setActiveMed(null);
    setDosage("");
    setFrequency("BID");
    setDuration(5);
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="w-full space-y-5">
      {/* ========================================================
          SEARCH
      ======================================================== */}
      <div className="relative">
        <label
          htmlFor="medication-search"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Search Medication
        </label>

        <div className="relative">
          <input
            id="medication-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={activeMed !== null}
            placeholder={
              activeMed
                ? "Configure the selected medication first..."
                : "Search medicine by name..."
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>
          )}
        </div>

        {/* ======================================================
            SEARCH DROPDOWN
        ====================================================== */}
        {searchResults.length > 0 && !activeMed && (
          <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {searchResults.map((medication) => {
              const isOutOfStock = Number(medication.stock_quantity) === 0;

              return (
                <div
                  key={medication.id}
                  className={`border-b border-gray-100 last:border-b-0 ${
                    isOutOfStock ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleSelectMedication(medication)}
                    className={`w-full px-4 py-3 text-left transition ${
                      isOutOfStock
                        ? "cursor-not-allowed text-gray-400"
                        : "cursor-pointer hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold ${
                            isOutOfStock ? "text-gray-400" : "text-gray-800"
                          }`}
                        >
                          {medication.item_name}
                        </p>

                        {medication.namaste_code && (
                          <p className="mt-1 text-xs text-gray-500">
                            Code: {medication.namaste_code}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {isOutOfStock ? (
                          <span className="text-xs font-semibold text-red-600">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Stock: {medication.stock_quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {!isSearching &&
          searchTerm.trim().length >= 2 &&
          searchResults.length === 0 &&
          !activeMed && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No active medication found.
            </div>
          )}
      </div>

      {/* ========================================================
          CONFIGURATION PANEL
      ======================================================== */}
      {activeMed && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Configure Medication
              </p>

              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {activeMed.item_name}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Available stock:{" "}
                <span className="font-semibold">{availableStock}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelConfiguration}
              className="rounded-md px-2 py-1 text-xl leading-none text-gray-500 transition hover:bg-white hover:text-gray-800"
              aria-label="Cancel medication configuration"
            >
              ×
            </button>
          </div>

          {/* Configuration fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Dosage */}
            <div>
              <label
                htmlFor="medication-dosage"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Dosage
              </label>

              <input
                id="medication-dosage"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500mg"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Frequency */}
            <div>
              <label
                htmlFor="medication-frequency"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Frequency
              </label>

              <select
                id="medication-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="OD">OD — Once Daily</option>
                <option value="BID">BID — Twice Daily</option>
                <option value="TID">TID — Three Times Daily</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="medication-duration"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Duration (Days)
              </label>

              <input
                id="medication-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ====================================================
              DYNAMIC STOCK CALCULATION
          ==================================================== */}
          <div className="mt-4 rounded-lg bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Required Quantity
                </p>

                <p className="text-xs text-gray-500">
                  {frequency} × {duration}{" "}
                  {Number(duration) === 1 ? "day" : "days"}
                </p>
              </div>

              <p
                className={`text-lg font-bold ${
                  exceedsStock ? "text-red-600" : "text-green-600"
                }`}
              >
                {requiredQuantity} units
              </p>
            </div>

            {/* Stock warning */}
            {exceedsStock && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-red-700">
                  Insufficient stock
                </p>

                <p className="mt-1 text-xs text-red-600">
                  You need {requiredQuantity} units, but only {availableStock}{" "}
                  units are currently available.
                </p>
              </div>
            )}

            {/* Stock available */}
            {!exceedsStock && requiredQuantity > 0 && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                <p className="text-xs font-medium text-green-700">
                  Stock available — {availableStock - requiredQuantity} units
                  remaining after dispensing.
                </p>
              </div>
            )}
          </div>

          {/* ====================================================
              ADD BUTTON
          ==================================================== */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleAddMedication}
              disabled={
                !dosage.trim() ||
                !frequency ||
                !duration ||
                Number(duration) <= 0 ||
                exceedsStock
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {exceedsStock ? "Insufficient Stock" : "Add Medication"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PRESCRIPTION LIST
      ======================================================== */}
      {prescribedItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              Prescribed Medications
            </h3>

            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {prescribedItems.length}{" "}
              {prescribedItems.length === 1 ? "Medication" : "Medications"}
            </span>
          </div>

          <div className="space-y-2">
            {prescribedItems.map((item, index) => (
              <div
                key={`${item.medication_id}-${index}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.item_name}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {item.dosage} • {item.frequency} for {item.duration_days}{" "}
                    {item.duration_days === 1 ? "day" : "days"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Quantity: {item.quantity_to_dispense}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${item.item_name}`}
                  title="Remove medication"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          EMPTY STATE
      ======================================================== */}
      {prescribedItems.length === 0 && !activeMed && (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-500">
            No medications prescribed yet
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Search for a medication above to add it to the prescription.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicationPrescriber;
