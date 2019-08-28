// tslint:disable: quotemark
import L from "leaflet";
import { FeatureCollection, Point, Polygon, MultiPolygon } from "geojson";

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

function testMarkerInPolygon() {
  const testPolygon: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [5.372005999088287, 43.292218320681535],
              [5.371668040752411, 43.292142181383625],
              [5.371839702129364, 43.29175562655459],
              [5.371928215026855, 43.29176734037339],
              [5.371850430965424, 43.29193523819489],
              [5.372105240821838, 43.29199185479762],
              [5.372005999088287, 43.292218320681535]
            ],
            [
              [5.371794104576111, 43.2920718988702],
              [5.371925532817841, 43.29210313555287],
              [5.371960401535034, 43.292017234636916],
              [5.3718262910842896, 43.29198404561415],
              [5.371794104576111, 43.2920718988702]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          inside: false,
          inhole: true
        },
        geometry: {
          type: "Point",
          coordinates: [5.371869206428528, 43.292036757583]
        }
      },
      {
        type: "Feature",
        properties: {
          inside: true,
          inhole: false
        },
        geometry: {
          type: "Point",
          coordinates: [5.371968448162078, 43.29213437221949]
        }
      }
    ]
  };

  const points = [testPolygon.features[1], testPolygon.features[2]];

  const geom = testPolygon.features[0].geometry as Polygon;
  const [outer, inners] = [
    L.polygon(geom.coordinates[0].map(([lng, lat]: [number, number]) => [
      lat,
      lng
    ]) as L.LatLngExpression[]),
    geom.coordinates
      .slice(1)
      .map(coords =>
        L.polygon((coords.map(([lng, lat]: [number, number]) => [
          lat,
          lng
        ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[])
      )
  ];
  return points.map(feature => {
    const marker = L.marker([
      (feature.geometry as Point).coordinates[1],
      (feature.geometry as Point).coordinates[0]
    ]);
    /*
    console.debug(
      marker,
      markerInPolygon(marker)(outer),
      inners.some(markerInPolygon(marker))
    );
    */
    // tslint:disable-next-line: no-non-null-assertion
    return `${feature.properties!.inside} === ${markerInPolygon(marker)(
      outer
    ) && !inners.some(markerInPolygon(marker))}`;
  });
}

function testMarkerInMultiPolygon() {
  const testPolygon: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [5.372005999088287, 43.292218320681535],
                [5.371668040752411, 43.292142181383625],
                [5.371839702129364, 43.29175562655459],
                [5.371928215026855, 43.29176734037339],
                [5.371850430965424, 43.29193523819489],
                [5.372105240821838, 43.29199185479762],
                [5.372005999088287, 43.292218320681535]
              ],
              [
                [5.371794104576111, 43.2920718988702],
                [5.371925532817841, 43.29210313555287],
                [5.371960401535034, 43.292017234636916],
                [5.3718262910842896, 43.29198404561415],
                [5.371794104576111, 43.2920718988702]
              ]
            ],
            [
              [
                [5.371834337711334, 43.29246040396974],
                [5.371928215026855, 43.292247605001506],
                [5.372161567211151, 43.29230422131346],
                [5.3720623254776, 43.29251311552573],
                [5.371834337711334, 43.29246040396974]
              ]
            ]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          inside: false,
          inhole: true
        },
        geometry: {
          type: "Point",
          coordinates: [5.371869206428528, 43.292036757583]
        }
      },
      {
        type: "Feature",
        properties: {
          inside: true,
          inhole: false
        },
        geometry: {
          type: "Point",
          coordinates: [5.371968448162078, 43.29213437221949]
        }
      }
    ]
  };

  const points = [testPolygon.features[1], testPolygon.features[2]];
  const geom = testPolygon.features[0].geometry as MultiPolygon;
  const polySet = geom.coordinates.map(polys => [
    {
      outer: L.polygon(polys[0].map(([lng, lat]: [number, number]) => [
        lat,
        lng
      ]) as L.LatLngExpression[]),
      inners: polys
        .slice(1)
        .map(coords =>
          L.polygon((coords.map(([lng, lat]: [number, number]) => [
            lat,
            lng
          ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[])
        )
    }
  ]);

  return points.map(feature => {
    // tslint:disable-next-line: no-non-null-assertion
    const inside = feature.properties!.inside;
    const marker = L.marker([
      (feature.geometry as Point).coordinates[1],
      (feature.geometry as Point).coordinates[0]
    ] as L.LatLngExpression);
    const isInside = polySet.some(p =>
      p.some(
        poly =>
          markerInPolygon(marker)(poly.outer) &&
          !poly.inners.some(markerInPolygon(marker))
      )
    );
    return `${inside} === ${isInside}`;
  });
}

console.debug(
  "testMarkerInPolygon:",
  testMarkerInPolygon().toString() === "false === false,true === true"
    ? "passed"
    : "failed"
);
console.debug(
  "testMarkerInMultiPolygon:",
  testMarkerInMultiPolygon().toString() === "false === false,true === true"
    ? "passed"
    : "failed"
);
