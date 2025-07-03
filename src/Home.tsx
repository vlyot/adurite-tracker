import React, { useState } from "react";

interface AduriteItem {
  limited_id: number;
  limited_name: string;
  rap: number;
  price: number;
  projected?: boolean;
}

function formatValue(n: number): string {
  if (n >= 1_000_000)
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

type HomeProps = {
  items: AduriteItem[];
  rateThreshold: number;
  setRateThreshold: (n: number) => void;
  minRAP: number;
  setMinRAP: (n: number) => void;
  maxRAP: number;
  setMaxRAP: (n: number) => void;
  sortBy: "rate" | "rap" | "value" | null;
  setSortBy: (s: "rate" | "rap" | "value" | null) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  error: string | null;
  darkMode: boolean;
  reloadFlag: number;
  setReloadFlag: (f: (n: number) => number) => void;
  runtime: number;
};

const Home: React.FC<HomeProps> = ({
  items,
  rateThreshold,
  setRateThreshold,
  minRAP,
  setMinRAP,
  maxRAP,
  setMaxRAP,
  sortBy,
  setSortBy,
  searchTerm,
  setSearchTerm,
  error,
  darkMode,
  reloadFlag,
  setReloadFlag,
  runtime,
}) => {
  const [selectedItem, setSelectedItem] = useState<AduriteItem | null>(null);

  const filtered = items
    .filter((entry) => {
      const rate = entry.price / (entry.rap / 1000);
      return (
        entry.rap >= minRAP &&
        entry.rap <= maxRAP &&
        rate <= rateThreshold &&
        entry.price > 0 &&
        entry.limited_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "rap") return a.rap - b.rap;
      if (sortBy === "value") return a.rap - b.rap;
      const rateA = a.price / (a.rap / 1000);
      const rateB = b.price / (b.rap / 1000);
      return rateA - rateB;
    });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <button
            className="btn btn-outline-light me-2"
            onClick={() => setSortBy("rap")}
          >
            RAP
          </button>
          <button
            className="btn btn-outline-light me-2"
            onClick={() => setSortBy("value")}
          >
            Value
          </button>
          <button
            className="btn btn-outline-light me-2"
            onClick={() => setSortBy("rate")}
          >
            Rate
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setSortBy(null)}
          >
            Reset
          </button>
        </div>
        <div className="d-flex align-items-center w-50 justify-content-end">
          <input
            className="form-control bg-dark text-light w-50 me-2"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="btn btn-outline-info me-2"
            onClick={() => setReloadFlag((f) => f + 1)}
            title="Reload data"
          >
            Reload
          </button>
          <span className="badge bg-secondary">
            Runtime: {Math.floor(runtime / 60)}:
            {(runtime % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center mb-3">
        <label className="me-2">Rate ≤</label>
        <input
          type="number"
          value={rateThreshold}
          onChange={(e) => setRateThreshold(parseFloat(e.target.value))}
          className="form-control bg-dark text-light me-3 w-25"
          step="0.1"
        />
        <label className="me-2">RAP Range:</label>
        <input
          type="number"
          value={minRAP}
          onChange={(e) => setMinRAP(parseInt(e.target.value))}
          className="form-control bg-dark text-light me-2 w-25"
        />
        <span className="me-2">to</span>
        <input
          type="number"
          value={maxRAP}
          onChange={(e) => setMaxRAP(parseInt(e.target.value))}
          className="form-control bg-dark text-light w-25"
        />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <p className={`mb-4 ${darkMode ? "text-light" : "text-muted"}`}>
        Showing items below <strong>{rateThreshold}</strong> within RAP range{" "}
        <strong>{formatValue(minRAP)}</strong> to{" "}
        <strong>{formatValue(maxRAP)}</strong>
        {sortBy ? (
          <>
            {" "}
            filtered by <strong>{sortBy.toUpperCase()}</strong>
          </>
        ) : null}
        .
      </p>

      <table
        className={`table ${
          darkMode ? "table-dark" : "table-light"
        } table-hover`}
      >
        <thead>
          <tr>
            <th>Item name</th>
            <th>Value</th>
            <th>RAP</th>
            <th>Rate</th>
            <th>Cost</th>
            <th>Projected</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry, i) => {
            const rate = entry.price / (entry.rap / 1000);
            return (
              <tr
                key={i}
                className={entry.projected ? "table-warning" : ""}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedItem(entry)}
              >
                <td>{entry.limited_name}</td>
                <td>{formatValue(entry.rap)}</td>
                <td>{entry.rap.toLocaleString()}</td>
                <td>{rate.toFixed(2)}</td>
                <td>${entry.price.toFixed(2)}</td>
                <td>
                  <span
                    className={`badge ${
                      entry.projected ? "bg-danger" : "bg-secondary"
                    }`}
                  >
                    {entry.projected ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal */}
      {selectedItem && (
        <div
          className="modal show fade d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className={`modal-content ${
                darkMode ? "bg-dark text-light" : ""
              }`}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedItem.limited_name} Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedItem(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Limited ID:</strong> {selectedItem.limited_id}
                </p>
                <p>
                  <strong>RAP:</strong> {selectedItem.rap.toLocaleString()}
                </p>
                <p>
                  <strong>Value:</strong> {formatValue(selectedItem.rap)}
                </p>
                <p>
                  <strong>Cost:</strong> ${selectedItem.price.toFixed(2)}
                </p>
                <p>
                  <strong>Rate:</strong>{" "}
                  {(selectedItem.price / (selectedItem.rap / 1000)).toFixed(2)}
                </p>
                <p>
                  <strong>Projected:</strong>{" "}
                  {selectedItem.projected ? "Yes" : "No"}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
