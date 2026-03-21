const axios = require("axios");

async function getRouteFeatures(bbox) {

  const query = `
  [out:json];
  (
    node["highway"="street_lamp"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
    node["shop"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
    node["amenity"="police"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
  );
  out;
  `;

  const res = await axios.post(
    "https://overpass-api.de/api/interpreter",
    query,
    { headers: { "Content-Type": "text/plain" } }
  );

  let streetLights = 0;
  let shops = 0;
  let policeStations = 0;

  for (const el of res.data.elements) {

    if (el.tags?.highway === "street_lamp") streetLights++;
    if (el.tags?.shop) shops++;
    if (el.tags?.amenity === "police") policeStations++;

  }

  return { streetLights, shops, policeStations };

}

module.exports = { getRouteFeatures };