import fs from "fs";
import path from "path";

const externalApi = "https://sb-notes-api.vercel.app/api/content";

export default async function handler(req, res) {
    const { bid, sid, id } = req.query;

    // Ensure required parameters are present
    if (!bid || !sid || !id) {
        return res.status(400).json({ error: "Missing required parameters: bid, sid, id" });
    }

    const cacheFilePath = path.join(process.cwd(), "data", "cachedData.json");

    // Ensure the cache file exists
    if (!fs.existsSync(cacheFilePath)) {
        fs.writeFileSync(cacheFilePath, JSON.stringify({}), "utf-8");
    }

    // Load existing cache
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

    const cacheKey = `${bid}-${sid}-${id}`;

    try {
        // Fetch data from the external API
        const response = await fetch(`${externalApi}?bid=${bid}&sid=${sid}&id=${id}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Save the fetched data to cache
        cacheData[cacheKey] = data;
        fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2), "utf-8");

        console.log("Data fetched from API and saved to cache.");
        return res.status(200).json({ source: "api", data });
    } catch (error) {
        console.error("External API failed:", error.message);

        // Check if data is available in cache
        if (cacheData[cacheKey]) {
            console.log("Serving data from cache as fallback.");
            return res.status(200).json({ source: "cache", data: cacheData[cacheKey] });
        }

        // Return error if no cache is available
        return res.status(500).json({ error: "No data available from cache or external API." });
    }
}
