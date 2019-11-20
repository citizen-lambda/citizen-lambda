import L from 'leaflet';

export const markerInPolygon = (marker: L.Marker) => (polygon: L.Polygon) => {
  /*
    https://en.wikipedia.org/wiki/Point_in_polygon#cite_note-6
    http://geomalgorithms.com/a03-_inclusion.html
    https://tools.ietf.org/html/rfc7946#section-3.1.6
    https://en.wikipedia.org/wiki/Rotation_number
  */
  const P = L.point(marker.getLatLng().lng, marker.getLatLng().lat);
  const V: L.Point[] = [];
  const edges = polygon.getLatLngs()[0] as L.LatLng[];

  for (const edge of edges) {
    V.push(L.point(edge.lng, edge.lat));
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
  const isLeft = (P0: L.Point, P1: L.Point, P2: L.Point) =>
    (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);

  for (let i = 0; i < n; i++) {
    if (V[i].y <= P.y) {
      if (V[i + 1].y > P.y) {
        if (isLeft(V[i], V[i + 1], P) > 0) {
          wn++;
        }
      }
    } else {
      if (V[i + 1].y <= P.y) {
        if (isLeft(V[i], V[i + 1], P) < 0) {
          wn--;
        }
      }
    }
  }
  // console.debug("wn:", wn);
  return polygon ? wn !== 0 : false;
};
