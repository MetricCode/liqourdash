const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

function toRad(value) {
  return (value * Math.PI) / 180;
}

const getDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const sortDeliveryPersonsByDistance = (deliveryPersons, userPos) => {
  // sort by distance, then assign an `id` based on sorted index
  return [...deliveryPersons]
    .sort((a, b) => {
      const da = getDistance(
        a.position.lat,
        a.position.lng,
        userPos.latitude,
        userPos.longitude
      );
      const db = getDistance(
        b.position.lat,
        b.position.lng,
        userPos.latitude,
        userPos.longitude
      );
      return da - db;
    })
    .map((person, index) => ({
      ...person,
      id: index, // new `id` field
    }));
};

export { getDistanceFromLatLonInKm, sortDeliveryPersonsByDistance };
