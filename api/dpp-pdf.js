
let videoCacheData = {};  // In-memory cache for the current video data

const videoApi = "https://sb-dpp-api.vercel.app/api/content";

export default async function handler(req, res) {
    const { bid, sid, id } = req.query;

    // Ensure required parameters are present
    if (!bid || !sid || !id) {
        return res.status(400).json({ error: "Missing required parameters: bid, sid, id" });
    }

    const cacheKey = `${bid}-${sid}-${id}`;

    try {
        // Fetch video data from the external video API
        const response = await fetch(`${videoApi}?bid=${bid}&sid=${sid}&id=${id}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Save the fetched video data in the in-memory cache
        videoCacheData[cacheKey] = data;

        console.log("Video data fetched from API and saved to memory.");
        return res.status(200).json({ source: "api", data });
    } catch (error) {
        console.error("Video API failed:", error.message);

        // Check if video data is available in cache
        if (videoCacheData[cacheKey]) {
            console.log("Serving video data from memory cache as fallback.");
            return res.status(200).json({ source: "cache", data: videoCacheData[cacheKey] });
        }

        // Return error if no data is available from cache
        return res.status(500).json({ error: "No video data available from cache or external API." });
    }
}
