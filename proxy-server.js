const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // ✅ correct

const app = express();
const PORT = 5174;

app.use(cors());

app.get("/rolimon-items", async (req, res) => {
  try {
    const response = await fetch("https://api.rolimons.com/items/v1/itemdetails");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Rolimon API:", error);  
    res.status(500).json({ error: "Failed to fetch Rolimon data" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
