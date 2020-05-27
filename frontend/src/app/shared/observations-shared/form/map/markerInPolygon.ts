import L from 'leaflet';

export const markerInPolygon = (marker: L.Marker) => (polygon: L.Polygon): boolean => {
  /*
    https://en.wikipedia.org/wiki/Point_in_polygon#cite_note-6
    http://geomalgorithms.com/a03-_inclusion.html
    https://tools.ietf.org/html/rfc7946#section-3.1.6
    https://en.wikipedia.org/wiki/Rotation_number
  */
  const P = L.latLng(marker.getLatLng());
  const V: L.LatLng[] = [];
  const edges = polygon.getLatLngs()[0] as L.LatLng[];

  for (const edge of edges) {
    V.push(L.latLng(edge));
  }
  /*
    The first and last positions are equivalent, and they MUST contain
    identical values; their representation SHOULD also be identical.
  */
  if (V[0] !== V[V.length - 1]) {
    V.push(V[0]);
  }
  const n = V.length - 1;
  let wn = 0;
  const isLeft = (P0: L.LatLng, P1: L.LatLng, P2: L.LatLng): number =>
    (P1.lng - P0.lng) * (P2.lat - P0.lat) - (P2.lng - P0.lng) * (P1.lat - P0.lat);

  for (let i = 0; i < n; i++) {
    if (V[i].lat <= P.lat) {
      if (V[i + 1].lat > P.lat) {
        if (isLeft(V[i], V[i + 1], P) > 0) {
          wn++;
        }
      }
    } else {
      if (V[i + 1].lat <= P.lat) {
        if (isLeft(V[i], V[i + 1], P) < 0) {
          wn--;
        }
      }
    }
  }
  // console.debug("wn:", wn);
  return polygon ? wn !== 0 : false;
};
