import fs from "fs";
import path from "path";

const apiUrl = "https://sb-notes-api.vercel.app/api/content?bid=neev-2-0-2025-376533&sid=664c4df7df7b3f00185286dd&id=664c515e9cbcf0c125d2ad20"; // Replace with your actual API

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "ID parameter is required" });
    }

    const dataPath = path.join(process.cwd(), "data", "responses.json");

    // Step 1: Load saved data
    let savedData = {};
    if (fs.existsSync(dataPath)) {
        const fileData = fs.readFileSync(dataPath, "utf-8");
        savedData = JSON.parse(fileData);
    }

    // Step 2: Check if data exists for the given ID
    if (savedData[id]) {
        console.log("Serving from saved data.");
        return res.status(200).json({ source: "cached", data: savedData[id] });
    }

    // Step 3: Fetch from external API
    try {
        const apiResponse = await fetch(`${apiUrl}?id=${id}`);
        const apiData = await apiResponse.json();

        // Save the new data
        savedData[id] = apiData;
        fs.writeFileSync(dataPath, JSON.stringify(savedData, null, 2));

        console.log("Serving from external API.");
        return res.status(200).json({ source: "api", data: apiData });
    } catch (error) {
        console.error("Error fetching from API:", error);
        return res.status(500).json({ error: "Failed to fetch data from external API" });
    }
}
