import * as express from "express";
import * as Loki from "lokijs";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";

const userAgent = "devtileproxy MY_EMAIL_GOES_HERE";
const DEBUG = true;
const tileServer = "tile.openstreetmap.org";
const photoServer = "wms.openstreetmap.fr/tms/1.0.0/tous_fr";

const db = new Loki("tile-db.json", { persistenceMethod: "fs" });
const tileDir = "tiles";
const imgTileDir = "photos";

if (!fs.existsSync(tileDir)) {
  fs.mkdirSync(tileDir);
}
if (!fs.existsSync(imgTileDir)) {
  fs.mkdirSync(imgTileDir);
}

const debug = (...args: any[]) => (DEBUG ? console.log(...args) : null);
const logError = (...args: any[]) => console.error(...args);

function get(url: string) {
  const options: https.RequestOptions = {
    headers: { "User-Agent": userAgent },
  };
  return new Promise<http.IncomingMessage>((resolve, reject) =>
    url.startsWith("https:")
      ? https.get(url, options, resolve).on("error", reject)
      : http.get(url, resolve).on("error", reject)
  );
}

async function saveResponse2File(
  response: http.IncomingMessage,
  filename: fs.PathLike
) {
  try {
    return new Promise<any>((resolve, reject) => {
      const file = fs.createWriteStream(filename);
      response.pipe(file);
      file.on("close", () => {
        debug(`Saved "${filename}"`);
        resolve(response);
      });
      file.on("error", reject);
    });
  } catch (error) {
    fs.unlink(filename, logError);
    return error;
  }
}

const download = async (
  url: string,
  filename: string
): Promise<http.IncomingMessage> =>
  get(url).then((response) => saveResponse2File(response, filename));

// Database
const loadCollection = (colName: string): Loki.Collection<any> => {
  return db.getCollection(colName) || db.addCollection(colName);
};

const sendFile = (
  response: express.Response,
  filename: string,
  mimetype: string
) => {
  response.set("Content-Type", mimetype);
  fs.createReadStream(filename).pipe(response);
};

const saveInDbAndSendFile = async (
  response: express.Response,
  filename: string,
  mimetype: string
) => {
  db.saveDatabase();
  sendFile(response, filename, mimetype);
};

// Web app
const app = express();
app.get(
  "/:s(a|b|c|photo)/:z(\\d{1,2})/:x(\\d+)/:y(\\d+)(.png)?",
  (request, response) => {
    try {
      const { s, x, y, z } = request.params;
      let collection: Loki.Collection<any>;

      debug("processing", s, z, x, y);
      if (s === "photo") {
        collection = loadCollection("photos");
      } else {
        collection = loadCollection("tiles");
      }
      const result = collection.findOne({ x: x, y: y, z: z });

      if (result) {
        debug("Cache hit:", result);
        sendFile(response, result.filename, result.mimetype);
      } else {
        const url =
          s === "photo"
            ? `https://${photoServer}/${z}/${x}/${y}`
            : `https://${s}.${tileServer}/${z}/${x}/${y}.png`;
        const filename =
          s === "photo"
            ? `${imgTileDir}/${z}-${x}-${y}.png`
            : `${tileDir}/${z}-${x}-${y}.png`;

        debug(
          `Cache miss: downloading ${
            s === "photo" ? "photo" : "tile"
          } to "${filename}" from "${url}"`
        );

        download(url, filename)
          .then((resp) => {
            const mimetype = resp.headers["content-type"].toString();
            const record = collection.insert({
              x: x,
              y: y,
              z: z,
              filename: filename,
              mimetype: mimetype,
            });
            debug("Registered", record);
            saveInDbAndSendFile(response, filename, mimetype);
          })
          .catch((error) => {
            logError(error);
            response.sendStatus(400);
          });
      }
    } catch (error) {
      // error with db or reading the file from fs?
      logError(error);
      response.sendStatus(400);
    }
  }
);

const port = 3001;
app.listen(port);
