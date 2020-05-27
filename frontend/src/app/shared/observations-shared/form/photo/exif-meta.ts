import { extractEXIFMetaData } from './exif-implementation';
/*
https://www.howtogeek.com/303410/how-to-prevent-android-from-geotagging-photos-with-your-location/
https://www.imore.com/how-disable-geotagging-camera-app-iphone-and-ipad
*/
// https://www.exiv2.org/tags.html
// Copyright, Artist
// DateTimeOriginal || GPSDateStamp
// GPSAltitude
// SubjectArea[a, b, c, d], SubjectLocation[x, y](centroid)
// ImageDescription, UserComment

export function sexagesimalDegreeToDecimalDegrees(
  degrees: number,
  minutes: number,
  seconds: number,
  reference: string
): number {
  /*
    https://en.wikipedia.org/wiki/Geographic_coordinate_conversion#Change_of_units_and_format
    reference is N/S of the equator for the latitude, E/W of the prime meridian for the longitude
  */
  let decimalDegrees = degrees + minutes / 60 + seconds / 3600;
  if (reference === 'S' || reference === 'W') {
    decimalDegrees *= -1;
  }
  return decimalDegrees;
}

function extractLat(meta: {
  GPSLatitude: [number, number, number];
  GPSLatitudeRef: string;
}): number {
  const [degree, minute, second] = meta.GPSLatitude;
  return sexagesimalDegreeToDecimalDegrees(degree, minute, second, meta.GPSLatitudeRef);
}

function extractLon(meta: {
  GPSLongitude: [number, number, number];
  GPSLongitudeRef: string;
}): number {
  const [degree, minute, second] = meta.GPSLongitude;
  return sexagesimalDegreeToDecimalDegrees(degree, minute, second, meta.GPSLongitudeRef);
}

function extractLatLonFromMeta(meta: {
  GPSLatitude: [number, number, number];
  GPSLatitudeRef: string;
  GPSLongitude: [number, number, number];
  GPSLongitudeRef: string;
}): [number, number] | null {
  if (meta && meta.GPSLatitude && meta.GPSLongitude) {
    return [extractLat(meta), extractLon(meta)];
  }
  return null;
}

export function extractLatLon(data: string | ArrayBuffer | null): [number, number] | null {
  if (data && data instanceof ArrayBuffer) {
    const meta = extractEXIFMetaData(data);
    return extractLatLonFromMeta(meta);
  }
  return null;
}
