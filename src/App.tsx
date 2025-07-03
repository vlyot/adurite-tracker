import { useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import Calculator from "./Calculator";
import Home from "./Home";

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
  const [runtime, setRuntime] = useState(0);
  const [page, setPage] = useState<"home" | "calculator">("home");

  // For reload button
  const [reloadFlag, setReloadFlag] = useState(0);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      const [aduriteRes, rolimonRaw] = await Promise.all([
        fetch("https://adurite.com/api/market/roblox").then((res) =>
          res.json()
        ),
        invoke("get_rolimon_items").then((res) => {
          if (typeof res !== "string" || res.startsWith("<!DOCTYPE")) {
            throw new Error("Invalid JSON response from Tauri");
          }
          return JSON.parse(res);
        }),
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
          projected,
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
  }, []);

  // Data fetching effect (runs on mount and reloadFlag change)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData, reloadFlag]);

  // Runtime timer effect
  useEffect(() => {
    setRuntime(0);
    const timer = setInterval(() => setRuntime((r) => r + 1), 1000);
    return () => clearInterval(timer);
  }, [reloadFlag]);

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
            <li className="nav-item">
              <a
                className="nav-link text-light"
                href="#"
                onClick={() => setPage("home")}
              >
                Home
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link text-light"
                href="#"
                onClick={() => setPage("calculator")}
              >
                Calculator
              </a>
            </li>
          </ul>
        </div>
        <div className="col-md-10 p-4">
          {page === "home" ? (
            <Home
              items={items}
              rateThreshold={rateThreshold}
              setRateThreshold={setRateThreshold}
              minRAP={minRAP}
              setMinRAP={setMinRAP}
              maxRAP={maxRAP}
              setMaxRAP={setMaxRAP}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              error={error}
              darkMode={darkMode}
              reloadFlag={reloadFlag}
              setReloadFlag={setReloadFlag}
              runtime={runtime}
            />
          ) : (
            <Calculator />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
