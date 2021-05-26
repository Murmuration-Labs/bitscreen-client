import { Request, Response, Application } from "express";
import { mkdirSync, writeFile, openSync, readFileSync, existsSync } from "fs";

import * as db from "./db";

const path = require("path");
const bodyParser = require("body-parser");

const express = require("express");
const cron = require("node-cron");
const axios = require("axios");

const cors = require("cors");
const { getAddressHash } = require("./crypto_lib");

const app: Application = express();
const basePath = path.join(process.env.HOME || "", ".murmuration");
const configPath = path.join(basePath, "config");
const filterPath = path.join(basePath, "bitscreen");

if (!existsSync(basePath)) {
  mkdirSync(basePath);
}

try {
  openSync(configPath, "r");
} catch (e) {
  console.log("writing default config file.");
  writeFile(
    configPath,
    JSON.stringify({
      bitscreen: false,
      share: false,
      advanced: {
        enabled: false,
        list: [],
      },
      filters: {
        internal: false,
        external: false,
      },
    }),
    // eslint-disable-next-line no-undef
    (err: NodeJS.ErrnoException | null) => {
      if (err) return console.error(err);
    }
  );
}

console.log(configPath);
console.log(filterPath);

app.use(cors());
app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());

app.get("/ping", (req: Request, res: Response) => {
  return res.send("pong");
});

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/config", (req: Request, res: Response) => {
  console.log("config requested");
  res.sendFile(configPath);
});

app.put("/config", (req: Request, res: Response) => {
  const file = JSON.parse(readFileSync(configPath).toString("utf8"));

  const actionPromise = new Promise((resolve, reject) => {
    writeFile(
      configPath,
      JSON.stringify({ ...file, ...req.body }),
      // eslint-disable-next-line no-undef
      (err: NodeJS.ErrnoException | null) => {
        // If an error occurred, show it and return
        if (err) {
          reject(err);
        } else {
          resolve([]);
        }
        // Successfully wrote binary contents to the file!
      }
    );
  });

  actionPromise
    .then(() =>
      res.send({
        success: true,
      })
    )
    .catch((err) => {
      res.send({
        success: false,
        error: err,
      });
    });
});


app.get("/filters", (req: Request, res: Response) => {
  db.findAll("bitscreen")
    .then((data) => res.send(data))
    .catch((err) => res.send({ error: err }));
});

app.get("/search-filters", (req: Request, res: Response) => {
  const searchTerm = req.query.search ? req.query.search.toString() : undefined;
  db.searchFilter("bitscreen", searchTerm)
    .then((data) => res.send(data))
    .catch((err) => res.send({ error: err }));
});

app.post("/filters", (req: Request, res: Response) => {
  db.insert("bitscreen", req.body)
    .then((data) =>
      res.send({
        success: true,
        _id: data,
      })
    )
    .catch((err) =>
      res.send({
        success: false,
        error: err,
      })
    );
});

app.put("/filters", (req: Request, res: Response) => {
  db.update("bitscreen", req.body)
    .then((data) =>
      res.send({
        success: true,
        _id: data,
      })
    )
    .catch((err) => {
      console.log(err);
      res.send({
        success: false,
      });
    });
});

app.delete("/filters/:id", (req: Request, res: Response) => {
  db.remove("bitscreen", parseInt(req.params.id))
    .then(() => {
      res.send({
        success: true,
      });
    })
    .catch((err) => {
      console.log(err);
      res.send({
        success: false,
      });
    });
});

app.get("/filters/shared/:_cryptId", (req: Request, res: Response) => {
  db.findBy("bitscreen", [
    {
      field: "_cryptId",
      value: req.params._cryptId,
    },
  ])
    .then((data) => {
      if (data.length === 0) {
        res.status(404).send([]);
      }

      // don't rehash cids fetched from another origin
      if (data[0].origin) {
          res.send(data[0]);
      } else {
          res.send(
              data.map((x) => {
                  x.cids = x.cids.map(getAddressHash);

                  return x;
              })[0]
          );
      }
    })
    .catch(() => {
      res.status(500).send([]);
    });
});

app.get("/filters/shared/:_cryptId/version", (req: Request, res: Response) => {
    db.findBy("bitscreen", [{
        field: '_cryptId',
        value: req.params._cryptId,
    }])
        .then((data) => {
            if (data.length > 0) {
                res.send({
                    _cryptId: data[0]._cryptId,
                    _lastUpdatedAt: data[0]._lastUpdatedAt,
                });
            } else {
                res.status(404).send({});
            }
        })
        .catch((err) => {
            console.log("Version error log", err);
            res.status(404).send({});
        })
});

interface Filter {
    _id?: number;
    cids: string[];
    visibility: number;
    enabled: boolean;
    origin?: string;
    _cryptId?: string;
    _lastUpdatedAt?: number;
}

cron.schedule("0 */4 * * *", () => {
    db.findAll("bitscreen")
        .then((data) => {
            const external = (data as Filter[]).filter((x: Filter) => {
                return !!x.origin;
            });

            const promises = external.map((importFilter: Filter) => new Promise(async (resolve, reject) => {
                const version = (await axios.get(`${importFilter.origin}/version`)).data;

                if (!version._lastUpdatedAt || (importFilter._lastUpdatedAt && version._lastUpdatedAt > importFilter._lastUpdatedAt)) {
                    const updatedImportFilter = (await axios.get(importFilter.origin)).data;

                    updatedImportFilter._id = importFilter._id;

                    return await db.update("bitscreen", updatedImportFilter);
                } else {
                    return importFilter._id;
                }
            }));

            Promise.all(promises).then((updated) => {
                console.log('Updated items:', promises.length);
            });
        });
}, true);

app.listen(process.env.PORT || 3030);
