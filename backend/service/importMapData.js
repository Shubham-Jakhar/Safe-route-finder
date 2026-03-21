const axios = require("axios");
const mongoose = require("mongoose");
const MapFeature = require("../models/mapFeature");

const MONGO_URI = process.env.DB_PATH;
mongoose.connect(MONGO_URI);

async function importData() {

    const query = `
[out:json];
(
  node["highway"="street_lamp"](30.60,76.70,30.85,76.90);
  node["amenity"="police"](30.60,76.70,30.85,76.90);
  node["shop"](30.60,76.70,30.85,76.90);
);
out;
  `;

    const res = await axios.post(
        "https://overpass-api.de/api/interpreter",
        query,
        { headers: { "Content-Type": "text/plain" } }
    );

    for (const el of res.data.elements) {

        let type = null;

        if (el.tags?.highway === "street_lamp") type = "street_lamp";
        if (el.tags?.shop) type = "shop";
        if (el.tags?.amenity === "police") type = "police";

        if (!type) continue;

        await MapFeature.create({
            type,
            location: {
                type: "Point",
                coordinates: [el.lon, el.lat]
            }
        });

    }

    console.log("Map data imported");
    process.exit();

}

importData();