// import EXIF from 'exif-js';
import ExifReader from 'exifreader';

const exifErrors = ExifReader.errors;

export function extractEXIFMetaData(data: ArrayBuffer): any {
  // return EXIF.readFromBinaryFile(data);

  if (data) {
    try {
      const tags = ExifReader.load(data, { expanded: true });
      // console.info(tags);
      return {
        GPSLatitude: (tags.exif?.GPSLatitude?.value as number[][] | undefined)?.map(
          x => x[0] / x[1]
        ),
        GPSLatitudeRef: tags.exif?.GPSLatitudeRef?.value[0],
        GPSLongitude: (tags.exif?.GPSLongitude?.value as number[][] | undefined)?.map(
          x => x[0] / x[1]
        ),
        GPSLongitudeRef: tags.exif?.GPSLongitudeRef?.value[0]
      };
    } catch (error) {
      if (error instanceof exifErrors.MetadataMissingError) {
        console.error('No Exif data found');
      }
    }
  }
}
