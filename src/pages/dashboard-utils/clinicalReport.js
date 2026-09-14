/**
 * ==========================================
 * CLINICAL REPORT GENERATION
 * ==========================================
 * Print/PDF export for a patient's clinical record.
 *
 * Kept separate from the dashboard UI because it's pure string
 * building with no React dependency — it takes a patient record and
 * case notes, and opens a printable HTML document. Easy to unit test
 * or swap for a real PDF library later without touching dashboard code.
 */

// Strips the AI-provenance emoji prefix (🗣️ patient-reported, 📄 OCR,
// 🤖 AI-inferred) before the text goes into an official printed document.
export function cleanProvenanceEmoji(text) {
  if (!text) return "";
  return text.replace(/^[🗣️📄🤖]\s*/, "");
}

/**
 * Opens a new window with a formatted clinical report for the given
 * patient and triggers the browser print dialog.
 */
export function downloadClinicalReport(patient, caseNotes) {
  if (!patient) return;

  const reportDate = new Date(patient.created_at).toLocaleDateString();
  const reportTime = new Date(patient.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return; // Popup blocked — nothing more we can do client-side.

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Clinical Report - ${patient.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
          .header p { margin: 5px 0 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: 800; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
          .label { font-weight: bold; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { font-size: 14px; margin-top: 2px; font-weight: 500; }
          .full-width { grid-column: span 2; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
          th { background-color: #f9fafb; color: #4b5563; font-size: 11px; text-transform: uppercase; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MediKiosk Clinical Report</h1>
          <p>Ministry of Ayush • Digitized OPD Record</p>
          <h4 style="margin-top: 15px; color: #4b5563;">Date: <strong>${reportDate}</strong> &nbsp;|&nbsp; Time: <strong>${reportTime}</strong></h4>
        </div>

        <div class="section">
          <div class="section-title">Patient Demographics</div>
          <div class="grid">
            <div><div class="label">Patient Name</div><div class="value">${patient.name}</div></div>
            <div><div class="label">Age / Gender</div><div class="value">${patient.age} Yrs / ${patient.gender}</div></div>
            <div><div class="label">ABHA ID</div><div class="value">${patient.abha_id || "Not Linked"}</div></div>
            <div><div class="label">Token Number</div><div class="value">${patient.token_number || "N/A"}</div></div>
            <div><div class="label">Triage Priority</div><div class="value" style="color: ${patient.is_red_flag ? "#dc2626" : "#16a34a"}">${patient.is_red_flag ? "🚨 URGENT EMERGENCY" : "Routine"}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Clinical Assessment</div>
          <div class="grid">
            <div class="full-width"><div class="label">Chief Complaint</div><div class="value">${cleanProvenanceEmoji(patient.primary_complaint)}</div></div>
            <div class="full-width"><div class="label">History of Present Illness (HPI)</div><div class="value">${cleanProvenanceEmoji(caseNotes)}</div></div>
            <div class="full-width"><div class="label">Differential Diagnosis</div><div class="value">${cleanProvenanceEmoji(patient.possible_diagnosis)}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Ayurvedic Dashavidha Pariksha</div>
          <div class="grid-3" style="margin-bottom: 15px;">
            <div><div class="label">Agni (Digestive Fire)</div><div class="value">${cleanProvenanceEmoji(patient.agni_status)}</div></div>
            <div><div class="label">Koshtha (Bowel Habit)</div><div class="value">${cleanProvenanceEmoji(patient.koshtha_status) || "Madhyama Koshtha"}</div></div>
            <div><div class="label">Ahara-Vihara (Diet & Lifestyle)</div><div class="value">${cleanProvenanceEmoji(patient.ahara_vihara)}</div></div>
          </div>
          <table>
            <thead><tr><th>Vikriti Parameter (Dosha)</th><th>Imbalance Percentage</th></tr></thead>
            <tbody>
              ${(patient.dosha_data || []).map((d) => `<tr><td style="font-weight: bold;">${d.subject}</td><td>${d.value}%</td></tr>`).join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Prior Investigations & OCR Findings</div>
          <div class="grid">
            <div class="full-width"><div class="label">Digitized Records Extract</div><div class="value">${cleanProvenanceEmoji(patient.extracted_doc_notes) || "No records provided during intake."}</div></div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by MediKiosk Automated Triage System • Document ID: ${patient.id}</p>
          <p style="margin-top: 30px;">Physician Signature: ___________________________</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
