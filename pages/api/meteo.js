// api/meteo.js
import fetch from "node-fetch";
import zlib from "zlib";
import Papa from "papaparse";

export default async function handler(req, res) {
  try {
    const { dep = "31" } = req.query; // par défaut Haute-Garonne
    const CSV_URL = `https://object.data.gouv.fr/6569ad61106d1679c93cdf77/dep${dep}_2025.csv.gz`;

    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Impossible de récupérer ${CSV_URL}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const decompressed = zlib.gunzipSync(buffer).toString("utf-8");
    const parsed = Papa.parse(decompressed, { header: true }).data;

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
