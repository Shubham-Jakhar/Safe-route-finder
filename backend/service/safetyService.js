const MapFeature = require("../models/mapFeature");
const UnsafeLocation = require("../models/unsafeLocation");
const { getDistance } = require("geolib");

const ROUTE_BUFFER = 100; 
async function calculateSafetyScore(points) {
  let score = 50;
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  points.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  const features = await MapFeature.find({
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    }
  });
  const unsafeLocations = await UnsafeLocation.find({
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    }
  });
  let streetLights = 0;
  let shops = 0;
  let policeStations = 0;
  let unsafeCount = 0;
  features.forEach(feature => {
    const [lng, lat] = feature.location.coordinates;
    for (let i = 0; i < points.length; i += 10) {
      const [routeLat, routeLng] = points[i];
      const dist = getDistance(
        { latitude: routeLat, longitude: routeLng },
        { latitude: lat, longitude: lng }
      );
      if (dist < ROUTE_BUFFER) {
        if (feature.type === "street_lamp") streetLights++;
        if (feature.type === "shop") shops++;
        if (feature.type === "police") policeStations++;
        break;
      }
    }
  });
  unsafeLocations.forEach(loc => {
    const [lng, lat] = loc.location.coordinates;
    for (let i = 0; i < points.length; i += 10) {
      const [routeLat, routeLng] = points[i];
      const dist = getDistance(
        { latitude: routeLat, longitude: routeLng },
        { latitude: lat, longitude: lng }
      );
      if (dist < ROUTE_BUFFER) {
        unsafeCount++;
        break;
      }
    }
  });
  score += Math.min(streetLights * 0.5, 10);
  score += Math.min(shops * 1, 8);
  score += Math.min(policeStations * 10, 20);
  score -= Math.min(unsafeCount * 4, 25);
  score = Math.max(0, Math.min(score, 100));

  console.log({
    streetLights,
    shops,
    policeStations,
    unsafeCount,
    score
  });

  return score;

}

module.exports = { calculateSafetyScore };