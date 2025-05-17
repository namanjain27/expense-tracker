import React, { useRef, useState } from "react";
import axios from "axios";

type Transaction = {
  Date: string;
  Description: string;
  Withdrawal: number;
  Deposit: number;
};

type Summary = {
  data: Transaction[];
  total_amount_withdrawn: number;
  total_amount_deposited: number;
  total_transactions: number;
  net_monthly_expenditure: number;
};

const ImportTransactions: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSummary(response.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
      setSummary(null);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div>
      <button
        onClick={triggerFileSelect}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        IMPORT
      </button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xls,.xlsx"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {summary && (
        <div className="mt-6 bg-gray-100 p-4 rounded shadow-lg">
          <h2 className="text-xl font-bold mb-2">Transaction Summary</h2>
          <p>Total Transactions: {summary.total_transactions}</p>
          <p>Total Withdrawn: ₹{summary.total_amount_withdrawn}</p>
          <p>Total Deposited: ₹{summary.total_amount_deposited}</p>

          <table className="mt-4 w-full text-left border-collapse border border-gray-300">
            <thead className="bg-gray-300">
              <tr>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Withdrawal</th>
                <th className="border px-2 py-1">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {summary.data.map((txn, index) => (
                <tr key={index} className="bg-white hover:bg-gray-100">
                  <td className="border px-2 py-1">{txn.Date}</td>
                  <td className="border px-2 py-1">{txn.Description}</td>
                  <td className="border px-2 py-1">{txn.Withdrawal}</td>
                  <td className="border px-2 py-1">{txn.Deposit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => setSummary(null)}
            className="mt-4 bg-red-500 text-white px-3 py-1 rounded"
          >
            Close Summary
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportTransactions;
