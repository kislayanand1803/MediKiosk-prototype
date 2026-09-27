import React from "react";
import { X, Printer } from "lucide-react";

const InvoiceReceipt = ({ patient, invoiceData, onClose }) => {
  // Get current date and time for the receipt
  const now = new Date();
  const formattedDate = now.toLocaleDateString();
  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Fallback values in case data is missing
  const items = invoiceData?.items || [];
  const subtotal = invoiceData?.subtotal || 0;
  const gst = invoiceData?.gst || 0;
  const total = invoiceData?.total || 0;
  const paymentMethod = invoiceData?.paymentMethod || "CASH";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:static print:block print:bg-transparent">
      {/* Receipt Card / Printable Area - Added 'receipt-container' for global CSS targeting */}
      <div className="receipt-container relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl print:m-0 print:w-full print:max-w-full print:rounded-none print:p-0 print:shadow-none text-black">
        {/* Screen-Only Header */}
        <div className="mb-4 flex items-center justify-between border-b pb-3 print:hidden">
          <h2 className="text-lg font-bold text-emerald-600">
            Transaction Successful
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Branding */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold uppercase tracking-wider">
            MediKiosk Pharmacy
          </h1>
          <p className="text-sm font-medium text-gray-600">
            Smart India Hackathon 2026
          </p>
          <p className="text-xs text-gray-500 mt-1">GSTIN: 09AAACA1234A1Z5</p>
        </div>

        {/* Dynamic Data Sections */}
        <div className="mb-6 grid grid-cols-2 gap-y-2 text-sm border-b border-dashed border-gray-300 pb-4">
          <div className="text-gray-600">Patient Name:</div>
          <div className="font-semibold text-right">
            {patient?.name || "Walk-in"}
          </div>

          <div className="text-gray-600">Token Number:</div>
          <div className="font-semibold text-right">
            {patient?.token || "N/A"}
          </div>

          <div className="text-gray-600">Date:</div>
          <div className="font-semibold text-right">{formattedDate}</div>

          <div className="text-gray-600">Time:</div>
          <div className="font-semibold text-right">{formattedTime}</div>
        </div>

        {/* Itemized Table */}
        <div className="mb-6 border-b border-dashed border-gray-300 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-center font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1.5 pr-2">{item.name}</td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">
                    ₹{item.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="text-sm">
          <div className="flex justify-between py-1 text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-gray-600">
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500 uppercase tracking-wide">
            <span>Payment Method</span>
            <span className="font-semibold">{paymentMethod}</span>
          </div>
        </div>

        {/* Print Action (Screen Only) */}
        <div className="mt-8 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-md hover:bg-blue-700 transition-colors"
          >
            <Printer size={18} />
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReceipt;
