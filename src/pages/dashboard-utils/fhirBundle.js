/**
 * ==========================================
 * ABDM FHIR R4 EXPORT
 * ==========================================
 * FHIR bundle generation plus the two small browser-API helpers
 * (clipboard copy, .json download) that use it.
 *
 * generateFhirBundle is pure data transformation with no React or
 * DOM dependency, split out so the FHIR-shape logic can be tested or
 * reused independently of the dashboard UI.
 */
import { cleanProvenanceEmoji } from "./clinicalReport";

/** Builds a Bundle resource containing Patient, Condition, and Observation entries for one patient record. */
export function generateFhirBundle(patient) {
  if (!patient) return {};
  const timestamp = new Date().toISOString();

  return {
    resourceType: "Bundle",
    id: `medikiosk-bundle-${patient.id || "session"}`,
    meta: {
      versionId: "1",
      lastUpdated: timestamp,
      profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"],
    },
    identifier: {
      system: "https://abdm.gov.in/facilities/medikiosk",
      value: `OPD-${patient.token_number || "TKN-001"}`,
    },
    type: "document",
    timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:patient-${patient.id || "001"}`,
        resource: {
          resourceType: "Patient",
          id: `patient-${patient.id || "001"}`,
          meta: {
            profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient"],
          },
          identifier: [
            {
              type: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                    code: "MR",
                    display: "ABHA Health ID",
                  },
                ],
              },
              system: "https://abdm.gov.in/abha",
              value: patient.abha_id || "Not Linked",
            },
          ],
          name: [{ text: patient.name }],
          gender: patient.gender ? patient.gender.toLowerCase() : "unknown",
        },
      },
      {
        fullUrl: `urn:uuid:condition-complaint-${patient.id || "001"}`,
        resource: {
          resourceType: "Condition",
          id: `condition-complaint-${patient.id || "001"}`,
          meta: {
            profile: ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition"],
          },
          clinicalStatus: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
                code: "active",
                display: "Active",
              },
            ],
          },
          category: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/condition-category",
                  code: "encounter-diagnosis",
                  display: "Encounter Diagnosis",
                },
              ],
            },
          ],
          code: {
            text: cleanProvenanceEmoji(patient.primary_complaint) || "Unspecified Complaint",
          },
          subject: { reference: `urn:uuid:patient-${patient.id || "001"}` },
        },
      },
      {
        fullUrl: `urn:uuid:observation-agni-${patient.id || "001"}`,
        resource: {
          resourceType: "Observation",
          id: `observation-agni-${patient.id || "001"}`,
          status: "final",
          code: { text: "Ayush Dashavidha Agni Assessment" },
          subject: { reference: `urn:uuid:patient-${patient.id || "001"}` },
          valueString: cleanProvenanceEmoji(patient.agni_status) || "Samagni",
        },
      },
      {
        fullUrl: `urn:uuid:observation-vikriti-${patient.id || "001"}`,
        resource: {
          resourceType: "Observation",
          id: `observation-vikriti-${patient.id || "001"}`,
          status: "final",
          code: { text: "Ayurvedic Tri-Dosha Imbalance (Vikriti)" },
          subject: { reference: `urn:uuid:patient-${patient.id || "001"}` },
          component: (patient.dosha_data || []).map((dosha) => ({
            code: { text: `${dosha.subject} Imbalance` },
            valueQuantity: {
              value: dosha.value,
              unit: "%",
              system: "http://unitsofmeasure.org",
              code: "%",
            },
          })),
        },
      },
    ],
  };
}

/** Copies the patient's FHIR bundle (as formatted JSON) to the clipboard. */
export function copyFhirBundle(patient) {
  const fhirString = JSON.stringify(generateFhirBundle(patient), null, 2);
  return navigator.clipboard.writeText(fhirString);
}

/** Downloads the patient's FHIR bundle as a .json file. */
export function downloadFhirBundle(patient) {
  const fhirString = JSON.stringify(generateFhirBundle(patient), null, 2);
  const blob = new Blob([fhirString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ABDM_FHIR_${patient?.token_number || "RECORD"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
