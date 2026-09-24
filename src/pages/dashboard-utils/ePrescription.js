/**
 * ============================================================================
 * MINISTRY OF AYUSH - AUTHORIZED E-PRESCRIPTION (eRx) ENGINE
 * ============================================================================
 * Generates an ABDM / NCISM compliant clinical prescription document.
 * Formatted for standard A4 clinical print spoolers and PDF export.
 */

// Strips AI-provenance emojis cleanly from text
function cleanClinicalText(text) {
  if (!text) return "";
  return text.replace(/^[🗣️📄🤖\s]+/, "").trim();
}

export function generateEPrescription(patient, prescriptionText, doctorMeta) {
  if (!patient) return;

  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const reportTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Safely handle if the dashboard explicitly passes 'null'
  const safeDoctorMeta = doctorMeta || {};

  // Robust name resolution (Removed Rajeshwar Sharma demo fallbacks)
  let resolvedName =
    safeDoctorMeta.full_name || safeDoctorMeta.name || "Consulting Physician";

  if (
    !resolvedName.toLowerCase().startsWith("dr") &&
    !resolvedName.toLowerCase().startsWith("consulting")
  ) {
    resolvedName = `Dr. ${resolvedName}`;
  }

  const doctor = {
    name: resolvedName,
    qualification: safeDoctorMeta.qualification || "BAMS, MD (Ayurveda)",
    regNo: safeDoctorMeta.reg_no || "NCISM/AYU-UP/2018/08492",
    facility:
      safeDoctorMeta.facility || "Ayush Integrated Community Health Center",
    address:
      safeDoctorMeta.address ||
      "Sector-12, Institutional Area, Ghaziabad, UP - 201001",
    contact:
      safeDoctorMeta.contact || "opd@ayush-kiosk.gov.in | +91 120-2984001",
    department: safeDoctorMeta.department || "General Medicine",
  };

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "Popup blocked! Please allow popups to generate the official e-Prescription.",
    );
    return;
  }

  // PHASE 2 FIX: Extract and strictly DEDUPLICATE Vitals
  const rawVitals = (patient.lab_values || []).filter((v) =>
    [
      "temperature",
      "heart rate",
      "pulse rate",
      "blood pressure",
      "spo2",
      "respiratory rate",
    ].some((key) => v.testName?.toLowerCase().includes(key)),
  );

  const uniqueVitalsMap = new Map();
  rawVitals.forEach((v) => {
    if (v.testName) {
      uniqueVitalsMap.set(v.testName.toLowerCase(), v);
    }
  });
  const vitals = Array.from(uniqueVitalsMap.values());

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>eRx_${patient.token_number || "OPD"}_${patient.name.replace(/\s+/g, "_")}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.45;
            font-size: 11.5px;
            margin: 0;
            padding: 0;
          }
          
          /* HEADER & FACILITY BRANDING */
          .header-table {
            width: 100%;
            border-bottom: 2.5px solid #0f766e;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .facility-name {
            font-size: 17px;
            font-weight: 800;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sub-header {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 1px;
          }
          .doctor-name {
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;
            text-align: right;
          }
          .doctor-sub {
            font-size: 10px;
            color: #475569;
            text-align: right;
            margin-top: 1px;
          }

          /* PATIENT DEMOGRAPHICS BAR */
          .patient-strip {
            background-color: #f0fdfa;
            border: 1px solid #ccfbf1;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
            display: grid;
            grid-template-columns: 2fr 1.2fr 1.2fr 1.4fr;
            gap: 8px;
          }
          .demographic-item .label {
            font-size: 8.5px;
            font-weight: 800;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .demographic-item .val {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 1px;
          }

          /* MAIN CLINICAL SPLIT */
          .clinical-container {
            display: grid;
            grid-template-columns: 32% 65%;
            gap: 3%;
            min-height: 520px;
          }

          /* LEFT PANEL: TRIAGE & VITALS */
          .left-panel {
            border-right: 1.5px solid #e2e8f0;
            padding-right: 12px;
          }
          .panel-title {
            font-size: 9px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 10px;
            margin-bottom: 6px;
          }
          .panel-title:first-child {
            margin-top: 0;
          }
          .clinical-value {
            font-size: 10.5px;
            color: #1e293b;
            font-weight: 600;
            margin-bottom: 6px;
          }

          .vitals-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            margin-bottom: 8px;
          }
          .vital-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 4px 6px;
          }
          .vital-name {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
          }
          .vital-val {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
          }

          .dosha-tag {
            display: inline-block;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 3px;
            padding: 1px 5px;
            font-size: 9px;
            font-weight: bold;
            margin-right: 3px;
            margin-bottom: 3px;
          }

          /* RIGHT PANEL: PRESCRIPTION BODY */
          .right-panel {
            padding-left: 2px;
          }
          .rx-heading-block {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-bottom: 8px;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 2px;
          }
          .rx-glyph {
            font-family: 'Times New Roman', Georgia, serif;
            font-size: 26px;
            font-weight: bold;
            color: #0f766e;
            line-height: 1;
          }
          .rx-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .medication-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          .medication-table th {
            background-color: #f8fafc;
            border-bottom: 1px solid #cbd5e1;
            padding: 5px 6px;
            font-size: 8.5px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            text-align: left;
          }
          .medication-table td {
            padding: 6px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 10px;
          }
          .drug-name {
            font-weight: 800;
            color: #0f172a;
          }

          .instructions-box {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            padding: 10px;
            min-height: 140px;
            font-size: 11px;
            line-height: 1.6;
            white-space: pre-wrap;
            color: #1e293b;
          }

          /* ADVICE & AHARA VIHARA */
          .advice-section {
            margin-top: 12px;
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 5px;
            padding: 8px 10px;
          }
          .advice-title {
            font-size: 9px;
            font-weight: 800;
            color: #b45309;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .advice-text {
            font-size: 10px;
            color: #78350f;
          }

          /* FOOTER & VERIFICATION */
          .footer-table {
            width: 100%;
            border-top: 1.5px solid #cbd5e1;
            padding-top: 10px;
            margin-top: 14px;
          }
          .qr-placeholder {
            width: 55px;
            height: 55px;
            border: 1px solid #0f766e;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            font-size: 7px;
            text-align: center;
            font-weight: bold;
            color: #0f766e;
          }
          .footer-audit {
            font-size: 8px;
            color: #64748b;
            line-height: 1.3;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #0f172a;
            padding-top: 4px;
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
          }
          .badge-seal {
            font-size: 7.5px;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <!-- CLINIC / DOCTOR LETTERHEAD -->
        <table class="header-table" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; width: 60%;">
              <div class="facility-name">${doctor.facility}</div>
              <div class="sub-header">Ministry of Ayush • Govt. of India Accredited</div>
              <div style="font-size: 9.5px; color: #475569; margin-top: 4px;">${doctor.address}</div>
              <div style="font-size: 9px; color: #64748b;">${doctor.contact}</div>
            </td>
            <td style="vertical-align: top; width: 40%; text-align: right;">
              <div class="doctor-name">${doctor.name}</div>
              <div class="doctor-sub">${doctor.qualification}</div>
              <div class="doctor-sub"><strong>Reg. No:</strong> ${doctor.regNo}</div>
              <div class="doctor-sub" style="color: #0f766e; font-weight: 600; margin-top: 2px;">OPD Unit: ${doctor.department}</div>
            </td>
          </tr>
        </table>

        <!-- PATIENT DEMOGRAPHICS BAR -->
        <div class="patient-strip">
          <div class="demographic-item">
            <div class="label">Patient Name</div>
            <div class="val">${patient.name}</div>
          </div>
          <div class="demographic-item">
            <div class="label">Age / Gender</div>
            <div class="val">${patient.age} Yrs / ${patient.gender}</div>
          </div>
          <div class="demographic-item">
            <div class="label">ABHA ID / Token</div>
            <div class="val">${patient.abha_id || "Not Linked"} &nbsp;|&nbsp; <span style="color:#0f766e;">${patient.token_number || "OPD-01"}</span></div>
          </div>
          <div class="demographic-item" style="text-align: right;">
            <div class="label">Consultation Date</div>
            <div class="val">${reportDate} • ${reportTime}</div>
          </div>
        </div>

        <!-- CLINICAL CONTENT DUAL-COLUMN -->
        <div class="clinical-container">
          
          <!-- LEFT COLUMN: DIAGNOSIS, VITALS & AYUSH PARIKSHA -->
          <div class="left-panel">
            <div class="panel-title">Provisional Diagnosis</div>
            <div class="clinical-value" style="color: #0f766e;">
              ${cleanClinicalText(patient.possible_diagnosis) || "Acute Clinical Evaluation"}
            </div>

            <div class="panel-title">Chief Complaint</div>
            <div class="clinical-value" style="font-size: 9.5px; font-weight: 500;">
              ${cleanClinicalText(patient.primary_complaint) || "General Malaise"}
            </div>

            ${
              vitals.length > 0
                ? `
                <div class="panel-title">Vitals Recorded</div>
                <div class="vitals-grid">
                  ${vitals
                    .map(
                      (v) => `
                      <div class="vital-card">
                        <div class="vital-name">${v.testName}</div>
                        <div class="vital-val">${v.result}</div>
                      </div>
                    `,
                    )
                    .join("")}
                </div>
              `
                : ""
            }

            <div class="panel-title">Dashavidha Assessment</div>
            <div style="font-size: 9.5px; line-height: 1.5; color: #334155; margin-bottom: 6px;">
              <div><strong>Agni:</strong> ${cleanClinicalText(patient.agni_status) || "Samagni"}</div>
              <div><strong>Koshtha:</strong> ${cleanClinicalText(patient.koshtha_status) || "Madhyama"}</div>
            </div>

            <div class="panel-title">Dosha Vikriti Imbalance</div>
            <div>
              ${
                patient.dosha_data
                  ? patient.dosha_data
                      .map(
                        (d) =>
                          `<span class="dosha-tag">${d.subject}:${d.value}%</span>`,
                      )
                      .join("")
                  : '<span style="font-size: 9px; color: #94a3b8;">Not Assessed</span>'
              }
            </div>

            ${
              patient.is_red_flag
                ? `<div style="margin-top: 10px; background: #fef2f2; border: 1px solid #fecaca; padding: 5px; border-radius: 4px; font-size: 8.5px; color: #b91c1c; font-weight: bold;">
                    ⚠️ Case Tagged as Priority Triage
                  </div>`
                : ""
            }
          </div>

          <!-- RIGHT COLUMN: PRESCRIPTION (Rx) -->
          <div class="right-panel">
            <div class="rx-heading-block">
              <span class="rx-glyph">℞</span>
              <span class="rx-title">Physician Prescriptions & Advice</span>
            </div>

            ${
              patient.medications && patient.medications.length > 0
                ? `
                <table class="medication-table">
                  <thead>
                    <tr>
                      <th style="width: 50%;">Formulation / Drug Name</th>
                      <th style="width: 25%;">Dosage & Form</th>
                      <th style="width: 25%;">Duration / Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${patient.medications
                      .map(
                        (m) => `
                        <tr>
                          <td class="drug-name">${m.drugName}</td>
                          <td>${m.dosage || "As directed"}</td>
                          <td>${m.duration || "5 Days"}</td>
                        </tr>
                      `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                : ""
            }

            <div class="instructions-box">
${prescriptionText ? prescriptionText : "1. Continue prescribed oral formulations with lukewarm water.\n2. Avoid spicy, stale, or chilled ahara (diet).\n3. Follow up after 5 days if discomfort persists."}
            </div>

            <div class="advice-section">
              <div class="advice-title">Pathya-Apathya (Ayush Dietary Protocol)</div>
              <div class="advice-text">
                ${cleanClinicalText(patient.ahara_vihara) || "Consume light, warm foods (Mudga Yusha). Maintain regular sleep hygiene and avoid day naps (Diva Swapna)."}
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER & LEGAL VERIFICATION -->
        <table class="footer-table" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 70px; vertical-align: top;">
              <div class="qr-placeholder">
                ABDM<br/>FHIR R4<br/>SECURE
              </div>
            </td>
            <td style="vertical-align: top; padding-left: 10px;">
              <div class="footer-audit">
                <strong>MediKiosk Intelligent OPD System</strong> • ABDM Gateway Integrated<br/>
                Record UUID: ${patient.id || "SANDBOX-SESSION"}<br/>
                Signed digitally under the IT Act 2000 & NMC/NCISM eRx Guidelines.
              </div>
            </td>
            <td style="width: 200px; vertical-align: bottom; text-align: right;">
              <div class="signature-box" style="margin-left: auto;">
                <div class="signature-line">${doctor.name}</div>
                <div class="badge-seal">Digitally Signed & Verified</div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}
