const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

console.log("Starting the server..."); // Add this for debugging

const baseUrl = "https://services.leadconnectorhq.com/products/";
const locationId = "f4J9w7Xpu7w4PftyYw2j"; // Replace with actual Location ID
const accessToken = "pit-a183822b-0996-4d1a-b3a8-5dbb184f6c3b"; // Replace with a valid OAuth token
const apiVersion = "2021-07-28";

app.get("/", (req, res) => {
    res.send("Server is running!");
});

app.post("/fetch-prices", async (req, res) => {
    console.log("Received request:", req.body); // Debugging

    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Invalid input. Provide an array of product IDs." });
    }

    try {
        const fetch = (await import("node-fetch")).default;

        const responses = await Promise.all(productIds.map(async (productId) => {
            const url = `${baseUrl}${productId}/price?locationId=${locationId}`;
            try {
                console.log(`Fetching: ${url}`); // Debugging

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                        "Version": apiVersion
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching price for ${productId}: ${response.statusText}`);
                }

                const jsonData = await response.json();
                return jsonData.prices ? jsonData.prices.map(price => price.amount) : [];
            } catch (error) {
                return { productId, error: error.message };
            }
        }));

        const extractedAmounts = responses.flat().filter(amount => typeof amount === "number");
        res.json({ amounts: extractedAmounts });
    } catch (error) {
        console.error("Internal Server Error:", error); // Debugging
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
