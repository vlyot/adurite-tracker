import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";

interface AduriteItem {
  limited_id: number;
  limited_name: string;
  rap: number;
  price: number;
  projected?: boolean;
}

function formatValue(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function App() {
  const [items, setItems] = useState<AduriteItem[]>([]);
  const [rateThreshold, setRateThreshold] = useState(4.5);
  const [minRAP, setMinRAP] = useState(0);
  const [maxRAP, setMaxRAP] = useState(1_000_000);
  const [sortBy, setSortBy] = useState<"rate" | "rap" | "value" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AduriteItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aduriteRes, rolimonRaw] = await Promise.all([
          fetch("https://adurite.com/api/market/roblox").then(res => res.json()),
          invoke("get_rolimon_items").then((res) => {
            if (typeof res !== "string" || res.startsWith("<!DOCTYPE")) {
              throw new Error("Invalid JSON response from Tauri");
            }
            return JSON.parse(res);
          })
        ]);

        const rolimonProjected = rolimonRaw?.items || {};
        const rawItems: any[] = Object.values(aduriteRes.items.items);

        const parsed = rawItems.map((entry: any) => {
          const roliData = rolimonProjected[String(entry.limited_id)];
          const projected = roliData && roliData[7] !== -1;

          return {
            limited_id: entry.limited_id,
            limited_name: entry.limited_name,
            rap: Number(entry.rap),
            price: Number(entry.price),
            projected
          };
        });

        const map = new Map<number, AduriteItem>();
        parsed.forEach((item) => {
          const existing = map.get(item.limited_id);
          if (!existing || item.price < existing.price) {
            map.set(item.limited_id, item);
          }
        });

        setItems(Array.from(map.values()));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not fetch data from one or more sources.");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

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

  const themeClasses = darkMode ? "bg-dark text-light" : "";

  return (
    <div className={`container-fluid min-vh-100 ${themeClasses}`}>
      <div className="row">
        <div className={`col-md-2 ${themeClasses} vh-100 p-3`}>
          <h4>AduriteTracker</h4>
          <button
            className={`btn btn-sm mb-3 ${darkMode ? "btn-light" : "btn-dark"}`}
            onClick={() => setDarkMode(!darkMode)}
          >
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>
          <ul className="nav flex-column">
            {["Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen"].map((label, idx) => (
              <li key={idx} className="nav-item">
                <a className="nav-link text-light" href="#">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-10 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button className="btn btn-outline-light me-2" onClick={() => setSortBy("rap")}>RAP</button>
              <button className="btn btn-outline-light me-2" onClick={() => setSortBy("value")}>Value</button>
              <button className="btn btn-outline-light me-2" onClick={() => setSortBy("rate")}>Rate</button>
              <button className="btn btn-outline-secondary" onClick={() => setSortBy(null)}>Reset</button>
            </div>
            <input
              className="form-control bg-dark text-light w-25"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

          <p className="mb-4 text-muted">
            Showing items below <strong>{rateThreshold}</strong> within RAP range <strong>{formatValue(minRAP)}</strong> to <strong>{formatValue(maxRAP)}</strong>
            {sortBy ? <> filtered by <strong>{sortBy.toUpperCase()}</strong></> : null}.
          </p>

          <table className={`table ${darkMode ? "table-dark" : "table-light"} table-hover`}>
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
                      <span className={`badge ${entry.projected ? 'bg-danger' : 'bg-secondary'}`}>
                        {entry.projected ? 'Yes' : 'No'}
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
                <div className={`modal-content ${darkMode ? "bg-dark text-light" : ""}`}>
                  <div className="modal-header">
                    <h5 className="modal-title">{selectedItem.limited_name} Details</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedItem(null)}></button>
                  </div>
                  <div className="modal-body">
                    <p><strong>Limited ID:</strong> {selectedItem.limited_id}</p>
                    <p><strong>RAP:</strong> {selectedItem.rap.toLocaleString()}</p>
                    <p><strong>Value:</strong> {formatValue(selectedItem.rap)}</p>
                    <p><strong>Cost:</strong> ${selectedItem.price.toFixed(2)}</p>
                    <p><strong>Rate:</strong> {(selectedItem.price / (selectedItem.rap / 1000)).toFixed(2)}</p>
                    <p><strong>Projected:</strong> {selectedItem.projected ? "Yes" : "No"}</p>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;