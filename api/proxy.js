import fs from "fs";
import path from "path";

const externalApi = "https://sb-notes-api.vercel.app/api/content";

export default async function handler(req, res) {
    const { bid, sid, id } = req.query;

    // Ensure all required parameters are present
    if (!bid || !sid || !id) {
        return res.status(400).json({ error: "Missing required parameters: bid, sid, id" });
    }

    const dataPath = path.join(process.cwd(), "data", "cachedResponses.json");

    // Step 1: Load Cached Data
    let cachedData = {};
    if (fs.existsSync(dataPath)) {
        cachedData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    }

    const cacheKey = `${bid}-${sid}-${id}`;

    // Step 2: Check if cached response exists
    if (cachedData[cacheKey]) {
        console.log("Serving data from cache.");
        return res.status(200).json({ source: "cache", data: cachedData[cacheKey] });
    }

    // Step 3: Fetch data from the external API
    try {
        const apiResponse = await fetch(`${externalApi}?bid=${bid}&sid=${sid}&id=${id}`);
        if (!apiResponse.ok) {
            throw new Error(`External API error: ${apiResponse.statusText}`);
        }

        const apiData = await apiResponse.json();

        // Step 4: Save the response to the cache
        cachedData[cacheKey] = apiData;
        fs.writeFileSync(dataPath, JSON.stringify(cachedData, null, 2));

        console.log("Serving data from external API.");
        return res.status(200).json({ source: "api", data: apiData });
    } catch (error) {
        console.error("Error fetching data from external API:", error.message);

        // Step 5: Fallback to cached data if API fails
        if (cachedData[cacheKey]) {
            return res.status(200).json({ source: "cache", data: cachedData[cacheKey] });
        }

        return res.status(500).json({ error: "Failed to fetch data from external API and no cache available." });
    }
}
