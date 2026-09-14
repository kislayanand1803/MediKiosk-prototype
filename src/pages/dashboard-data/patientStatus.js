/**
 * ==========================================
 * PATIENT STATUS CONSTANTS
 * ==========================================
 * Canonical status strings used across the queue, filters, and status
 * badges. Defined once here so a typo in a status string can't
 * silently break a filter — every file imports from this constant
 * instead of retyping "Approved" / "In Consultation" by hand.
 */
export const PATIENT_STATUS = {
  WAITING: "Waiting",
  IN_CONSULTATION: "In Consultation",
  APPROVED: "Approved",
};

/**
 * Config for the three queue-filter pills in the sidebar. `activeColor`
 * maps to the color variants supported by <TabButton>.
 */
export const QUEUE_FILTERS = [
  { id: PATIENT_STATUS.WAITING, label: "Waiting", activeColor: "blue" },
  { id: PATIENT_STATUS.IN_CONSULTATION, label: "In Consult", activeColor: "purple" },
  { id: PATIENT_STATUS.APPROVED, label: "Completed", activeColor: "green" },
];
