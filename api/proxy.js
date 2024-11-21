import fs from "fs";
import path from "path";

const externalApi = "https://sb-notes-api.vercel.app/api/content";

export default async function handler(req, res) {
    const { bid, sid, id } = req.query;

    // Ensure required parameters are present
    if (!bid || !sid || !id) {
        return res.status(400).json({ error: "Missing required parameters: bid, sid, id" });
    }

    const dataPath = path.join(process.cwd(), "data", "cachedResponses.json");

    // Step 1: Ensure the cache file exists
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}), "utf-8");
    }

    // Load the existing cache
    let cachedData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const cacheKey = `${bid}-${sid}-${id}`;

    // Step 2: Fetch data from the external API
    try {
        const apiResponse = await fetch(`${externalApi}?bid=${bid}&sid=${sid}&id=${id}`);
        if (!apiResponse.ok) {
            throw new Error(`External API error: ${apiResponse.statusText}`);
        }

        const apiData = await apiResponse.json();

        // Step 3: Save the response to the cache
        cachedData[cacheKey] = apiData;
        fs.writeFileSync(dataPath, JSON.stringify(cachedData, null, 2), "utf-8");

        console.log("Serving data from external API and saved to cache.");
        return res.status(200).json({ source: "api", data: apiData });
    } catch (error) {
        console.error("External API failed:", error.message);

        // Step 4: Fallback to cache if API fails
        if (cachedData[cacheKey]) {
            console.log("Serving data from cache as fallback.");
            return res.status(200).json({ source: "cache", data: cachedData[cacheKey] });
        }

        // Step 5: Return error if no cache is available
        return res.status(500).json({ error: "No data available from cache or external API." });
    }
}
