let cacheData = {};  // In-memory cache for the current execution

const externalApi = "https://sb-notes-api.vercel.app/api/content";

export default async function handler(req, res) {
    const { bid, sid, id } = req.query;

    // Ensure required parameters are present
    if (!bid || !sid || !id) {
        return res.status(400).json({ error: "Missing required parameters: bid, sid, id" });
    }

    const cacheKey = `${bid}-${sid}-${id}`;

    try {
        // Fetch data from the external API
        const response = await fetch(`${externalApi}?bid=${bid}&sid=${sid}&id=${id}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Save the fetched data in the in-memory cache
        cacheData[cacheKey] = data;

        console.log("Data fetched from API and saved to memory.");
        return res.status(200).json({ source: "api", data });
    } catch (error) {
        console.error("External API failed:", error.message);

        // Check if data is available in cache
        if (cacheData[cacheKey]) {
            console.log("Serving data from memory cache as fallback.");
            return res.status(200).json({ source: "cache", data: cacheData[cacheKey] });
        }

        // Return error if no data is available from cache
        return res.status(500).json({ error: "No data available from cache or external API." });
    }
}
