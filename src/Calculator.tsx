import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "KRW", label: "South Korean Won" },
  { code: "NOK", label: "Norwegian Krone" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "HKD", label: "Hong Kong Dollar" },
  // Add more as needed
];

export default function Calculator() {
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert automatically on any input change
  useEffect(() => {
    let cancelled = false;
    async function convert() {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await invoke<number>("get_exchange_rate", {
          from,
          to,
          amount,
        });
        if (!cancelled) setResult(res ?? null);
      } catch (err) {
        if (!cancelled) setError("Failed to fetch exchange rate.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (amount > 0 && from && to) convert();
    else setResult(null);
    return () => {
      cancelled = true;
    };
  }, [amount, from, to]);

  return (
    <div>
      <h3>Currency Exchanger</h3>
      <form className="mb-3" onSubmit={(e) => e.preventDefault()}>
        <div className="row g-2 align-items-end">
          <div className="col-auto">
            <input
              type="number"
              className="form-control"
              value={amount}
              min={0}
              step={0.01}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>
          <div className="col-auto">
            <select
              className="form-select"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <span>to</span>
          </div>
          <div className="col-auto">
            <select
              className="form-select"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
      {loading && <div className="alert alert-info mt-3">Converting...</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {result !== null && !loading && !error && (
        <div className="alert alert-success mt-3">
          {amount} {from} = {result.toFixed(2)} {to}
        </div>
      )}
    </div>
  );
}
