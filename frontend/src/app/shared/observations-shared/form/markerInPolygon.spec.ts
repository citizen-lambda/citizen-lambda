import { FeatureCollection, Polygon, Point, MultiPolygon } from 'geojson';
import L from 'leaflet';

import { markerInPolygon } from './markerInPolygon';

function testMarkerInPolygon() {
  const testPolygon: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
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
        type: 'Feature',
        properties: {
          inside: false,
          inhole: true
        },
        geometry: {
          type: 'Point',
          coordinates: [5.371869206428528, 43.292036757583]
        }
      },
      {
        type: 'Feature',
        properties: {
          inside: true,
          inhole: false
        },
        geometry: {
          type: 'Point',
          coordinates: [5.371968448162078, 43.29213437221949]
        }
      }
    ]
  };

  const points = [testPolygon.features[1], testPolygon.features[2]];

  const geom = testPolygon.features[0].geometry as Polygon;
  const [outer, inners] = [
    L.polygon(
      (geom.coordinates[0] as [number, number][]).map(([lng, lat]) => [
        lat,
        lng
      ]) as L.LatLngExpression[]
    ),
    geom.coordinates
      .slice(1)
      .map(coords =>
        L.polygon(
          ((coords as [number, number][]).map(([lng, lat]) => [
            lat,
            lng
          ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[]
        )
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
    return `${feature.properties?.inside} === ${
      markerInPolygon(marker)(outer) && !inners.some(markerInPolygon(marker))
    }`;
  });
}

function testMarkerInMultiPolygon() {
  const testPolygon: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'MultiPolygon',
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
        type: 'Feature',
        properties: {
          inside: false,
          inhole: true
        },
        geometry: {
          type: 'Point',
          coordinates: [5.371869206428528, 43.292036757583]
        }
      },
      {
        type: 'Feature',
        properties: {
          inside: true,
          inhole: false
        },
        geometry: {
          type: 'Point',
          coordinates: [5.371968448162078, 43.29213437221949]
        }
      }
    ]
  };

  const points = [testPolygon.features[1], testPolygon.features[2]];
  const geom = testPolygon.features[0].geometry as MultiPolygon;
  const polySet = geom.coordinates.map(polys => [
    {
      outer: L.polygon(
        (polys[0] as [number, number][]).map(([lng, lat]) => [lat, lng]) as L.LatLngExpression[]
      ),
      inners: polys
        .slice(1)
        .map(coords =>
          L.polygon(
            ((coords as [number, number][]).map(([lng, lat]) => [
              lat,
              lng
            ]) as L.LatLngExpression[]).reverse() as L.LatLngExpression[]
          )
        )
    }
  ]);

  return points.map(feature => {
    const inside = feature.properties?.inside;
    const marker = L.marker([
      (feature.geometry as Point).coordinates[1],
      (feature.geometry as Point).coordinates[0]
    ] as L.LatLngExpression);
    const isInside = polySet.some(p =>
      p.some(
        poly => markerInPolygon(marker)(poly.outer) && !poly.inners.some(markerInPolygon(marker))
      )
    );
    return `${inside} === ${isInside}`;
  });
}

/* console.debug(
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
); */
describe('markerInPolygon', () => {
  it('should find the markers (not contained, contained) in the Polygon', () => {
    expect(testMarkerInPolygon().toString()).toEqual('false === false,true === true');
  });

  it('should find the markers (not contained, contained) in the MultiPolygon', () => {
    expect(testMarkerInMultiPolygon().toString()).toEqual('false === false,true === true');
  });
});
