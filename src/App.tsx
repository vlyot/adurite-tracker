import { useEffect, useState } from "react";
import "./App.css";

interface AduriteItem {
  limited_name: string;
  rap: number;
  price: number;
}

function App() {
  const [items, setItems] = useState<AduriteItem[]>([]);
  const [rateThreshold, setRateThreshold] = useState(4.5);
  const [minRAP, setMinRAP] = useState(0);
  const [maxRAP, setMaxRAP] = useState(1_000_000);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://adurite.com/api/market/roblox");
      const json = await res.json();

      // Enforce typing so TypeScript knows it's AduriteItem[]
const rawItems: AduriteItem[] = Object.values(json.items.items).map((item: any) => ({
  limited_name: item.limited_name,
  rap: Number(item.rap),
  price: Number(item.price),
}));

// Remove duplicates by keeping only the lowest priced entry for each item
const dedupedMap: Record<string, AduriteItem> = {};
for (const item of rawItems) {
  if (!dedupedMap[item.limited_name] || item.price < dedupedMap[item.limited_name].price) {
    dedupedMap[item.limited_name] = item;
  }
}

// ✅ Convert back to array and set state
setItems(Object.values(dedupedMap));


    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

const filtered = items
  .filter((entry) => {
    const { rap, price } = entry;
    const rate = price / (rap / 1000);
    return (
      rap >= minRAP &&
      rap <= maxRAP &&
      rate <= rateThreshold &&
      price > 0
    );
  })
  .sort((a, b) => (a.price / (a.rap / 1000)) - (b.price / (b.rap / 1000)));


  return (
    <main className="container">
      <h1>Adurite Item Tracker</h1>
      <div className="row">
        <label>Rate ≤</label>
        <input
          type="number"
          value={rateThreshold}
          onChange={(e) => setRateThreshold(parseFloat(e.target.value))}
          step="0.1"
        />
        <label>RAP Range:</label>
        <input
          type="number"
          value={minRAP}
          onChange={(e) => setMinRAP(parseInt(e.target.value))}
        />
        <span>to</span>
        <input
          type="number"
          value={maxRAP}
          onChange={(e) => setMaxRAP(parseInt(e.target.value))}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>RAP</th>
            <th>Price ($)</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry, i) => {
            const rate = entry.price / (entry.rap / 1000);
            return (
              <tr key={i}>
                <td>{entry.limited_name}</td>
                <td>{entry.rap}</td>
                <td>${entry.price.toFixed(2)}</td>
                <td>{rate.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

export default App;
