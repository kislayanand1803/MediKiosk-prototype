/**
 * ==========================================
 * HL7 FHIR R4 MAPPING ENGINE (ABDM COMPLIANT)
 * ==========================================
 * This utility converts our local Ayush JSON data into a standardized
 * FHIR R4 Bundle. This is the exact format required by the National
 * Health Authority (NHA) to register a "Care Context" on the ABDM gateway.
 */

export function generateFHIRBundle(caseData) {
  const timestamp = new Date().toISOString();
  const bundleId = `urn:uuid:${crypto.randomUUID()}`;
  const patientId = `urn:uuid:${crypto.randomUUID()}`;
  const encounterId = `urn:uuid:${crypto.randomUUID()}`;

  // Helper to map UI gender to FHIR standard
  const mapGender = (g) => {
    const lower = g.toLowerCase();
    if (["male", "female", "other", "unknown"].includes(lower)) return lower;
    return "unknown";
  };

  const fhirBundle = {
    resourceType: "Bundle",
    id: bundleId,
    type: "collection",
    timestamp: timestamp,
    entry: [
      // 1. PATIENT RESOURCE
      {
        fullUrl: patientId,
        resource: {
          resourceType: "Patient",
          id: patientId,
          identifier: [
            {
              system: "https://healthid.ndhm.gov.in",
              value:
                caseData.abha_id !== "Not Linked"
                  ? caseData.abha_id
                  : "UNREGISTERED",
            },
          ],
          name: [{ text: caseData.name }],
          gender: mapGender(caseData.gender),
          // FHIR requires birthDate, so we approximate it from the given age
          birthDate: new Date(
            new Date().getFullYear() - parseInt(caseData.age),
            0,
            1,
          )
            .toISOString()
            .split("T")[0],
        },
      },
      // 2. ENCOUNTER RESOURCE (The OPD Visit)
      {
        fullUrl: encounterId,
        resource: {
          resourceType: "Encounter",
          id: encounterId,
          status: "in-progress",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory", // OPD Walk-in
          },
          subject: { reference: patientId },
          period: { start: timestamp },
        },
      },
      // 3. CONDITION RESOURCE (Chief Complaint)
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: "Condition",
          clinicalStatus: {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/condition-clinical",
                code: "active",
              },
            ],
          },
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/condition-category",
                  code: "encounter-diagnosis",
                },
              ],
            },
          ],
          code: { text: caseData.primary_complaint },
          subject: { reference: patientId },
          encounter: { reference: encounterId },
        },
      },
      // 4. CLINICAL IMPRESSION (Ayush Specific Triage Data)
      {
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: "ClinicalImpression",
          status: "completed",
          subject: { reference: patientId },
          encounter: { reference: encounterId },
          description: "Ayush AI Triage Assessment",
          investigation: [
            {
              code: { text: "Dashavidha Pariksha Metrics" },
              item: [
                { display: `Agni Status: ${caseData.agni_status}` },
                { display: `Koshtha Status: ${caseData.koshtha_status}` },
              ],
            },
            {
              code: { text: "Tridosha Imbalance (Vikriti)" },
              item: caseData.dosha_data.map((dosha) => ({
                display: `${dosha.subject} Score: ${dosha.value}/100`,
              })),
            },
          ],
          summary: caseData.possible_diagnosis,
        },
      },
    ],
  };

  return fhirBundle;
}
