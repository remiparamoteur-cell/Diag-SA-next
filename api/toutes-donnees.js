// pages/api/toutes-donnees.js
import axios from "axios";

export default async function handler(req, res) {
  try {
    // 1. Récupérer le catalogue complet
    const catalogUrl = "https://geoservices.meteofrance.fr/api/MFSC/v1/catalog";
    const catalogResponse = await axios.get(catalogUrl, {
      headers: {
        Authorization: `Bearer ${process.env.MFSC_CNR}`,
      },
    });

    const stations = catalogResponse.data?.stations || [];
    if (stations.length === 0) {
      return res.status(404).json({ error: "Aucune station trouvée" });
    }

    // 2. Limiter pour le test (ici 3 stations)
    const stationsTest = stations.slice(0, 3);

    // 3. Boucler sur chaque station et récupérer toutes les mesures
    const results = [];
    for (const station of stationsTest) {
      const { latitude, longitude, nom } = station;

      const dataUrl = `https://geoservices.meteofrance.fr/api/MFSC/v1/forecast?lat=${latitude}&lon=${longitude}&model=arome_france_surface&parameter=ALL&date=${new Date().toISOString().split("T")[0]}`;

      try {
        const dataResponse = await axios.get(dataUrl, {
          headers: {
            Authorization: `Bearer ${process.env.MFSC_CNR}`,
          },
        });

        results.push({
          station: nom,
          coords: { lat: latitude, lon: longitude },
          mesures: dataResponse.data,
        });
      } catch (err) {
        results.push({
          station: nom,
          coords: { lat: latitude, lon: longitude },
          error: err.response?.data || err.message,
        });
      }
    }

    // 4. Retourner le tout
    res.status(200).json({
      totalStationsDansCatalogue: stations.length,
      stationsIncluses: stationsTest.length,
      donnees: results,
    });
  } catch (error) {
    console.error("Erreur API Météo-France :", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Impossible de récupérer toutes les données",
      details: error.response?.data || error.message,
    });
  }
}
