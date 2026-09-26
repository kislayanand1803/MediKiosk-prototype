/**
 * ==========================================
 * HL7 FHIR R4 MAPPING ENGINE (ABDM COMPLIANT)
 * ==========================================
 * Formats local Ayush data into a standardized FHIR R4 Bundle.
 * Upgraded to support Ayush NAMASTE/SNOMED-CT coding and proper
 * Observation resources for Dosha and Agni metrics.
 */

export function generateFHIRBundle(caseData) {
  const timestamp = new Date().toISOString();
  const bundleId = `urn:uuid:${crypto.randomUUID()}`;
  const patientId = `urn:uuid:${crypto.randomUUID()}`;
  const encounterId = `urn:uuid:${crypto.randomUUID()}`;

  const mapGender = (g) => {
    const lower = g?.toLowerCase() || "unknown";
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
          birthDate: new Date(
            new Date().getFullYear() - parseInt(caseData.age || "30"),
            0,
            1,
          )
            .toISOString()
            .split("T")[0],
        },
      },
      // 2. ENCOUNTER RESOURCE
      {
        fullUrl: encounterId,
        resource: {
          resourceType: "Encounter",
          id: encounterId,
          status: "in-progress",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory",
          },
          subject: { reference: patientId },
          period: { start: timestamp },
        },
      },
      // 3. CONDITION RESOURCE (Coded with Ayush/SNOMED standards)
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
          code: {
            coding: [
              {
                system: "http://snomed.info/sct", // Fallback to SNOMED CT / NAMASTE System
                code: caseData.diagnosis_code || "418038007", // Default "Propensity to adverse reactions" if unspecified
                display:
                  caseData.possible_diagnosis || "Symptomatic presentation",
              },
            ],
            text: caseData.primary_complaint,
          },
          subject: { reference: patientId },
          encounter: { reference: encounterId },
        },
      },
    ],
  };

  // 4. OBSERVATION RESOURCES (Proper FHIR mapping for Ayush Metrics)
  if (caseData.dosha_data && Array.isArray(caseData.dosha_data)) {
    caseData.dosha_data.forEach((dosha) => {
      fhirBundle.entry.push({
        fullUrl: `urn:uuid:${crypto.randomUUID()}`,
        resource: {
          resourceType: "Observation",
          status: "final",
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "exam",
                  display: "Exam",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://ayush.gov.in/namaste/dosha",
                code: `DOSHA-${dosha.subject.toUpperCase()}`,
                display: `${dosha.subject} Vikriti Assessment`,
              },
            ],
          },
          subject: { reference: patientId },
          encounter: { reference: encounterId },
          valueQuantity: {
            value: dosha.value,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },
        },
      });
    });
  }

  // 5. OBSERVATION: AGNI / KOSHTHA
  fhirBundle.entry.push({
    fullUrl: `urn:uuid:${crypto.randomUUID()}`,
    resource: {
      resourceType: "Observation",
      status: "final",
      code: {
        text: "Ayush Dashavidha Pariksha - Agni & Koshtha",
      },
      subject: { reference: patientId },
      encounter: { reference: encounterId },
      component: [
        {
          code: { text: "Agni Status" },
          valueString: caseData.agni_status || "Pending",
        },
        {
          code: { text: "Koshtha Status" },
          valueString: caseData.koshtha_status || "Pending",
        },
      ],
    },
  });

  return fhirBundle;
}
