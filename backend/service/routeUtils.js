function getBoundingBox(points) {

  const lats = points.map(p => p[0]);
  const lngs = points.map(p => p[1]);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs)
  };

}

module.exports = { getBoundingBox };