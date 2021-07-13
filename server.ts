import { Request, Response, Application } from "express";
import { mkdirSync, writeFile, openSync, readFileSync, existsSync } from "fs";

import * as db from "./db";
import complaintsRoutes from "./endpoints/complaints";
import { SortingCriteria } from "./db";

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
const databaseName = "local_database";

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

console.log("config path:", configPath);
console.log("filter path:", filterPath);

app.use(cors());
app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(complaintsRoutes);

app.get("/ping", (req: Request, res: Response) => {
  return res.send("pong");
});

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/config", (req: Request, res: Response) => {
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
  db.findAll(databaseName, "bitscreen")
    .then((data) => res.send(data))
    .catch((err) => res.send({ error: err }));
});

app.get("/search-filters", (req: Request, res: Response) => {
  const searchTerm = req.query.search ? req.query.search.toString() : undefined;
  db.searchFilter(databaseName, "bitscreen", searchTerm)
    .then((data) => res.send(data))
    .catch((err) => res.send({ error: err }));
});

app.post("/filters", (req: Request, res: Response) => {
  db.insert(databaseName, "bitscreen", req.body)
    .then(async (data) => {
      if (!req.body.name) {
        const updateObj: any = {
          _id: data,
          name: `New filter (${data})`,
        };

        if (!req.body.cids) {
          updateObj.cids = [];
        }

        await db.update(databaseName, "bitscreen", updateObj);
      }

      res.send({
        success: true,
        _id: data,
      });
    })
    .catch((err) =>
      res.send({
        success: false,
        error: err,
      })
    );
});

app.put("/filters", (req: Request, res: Response) => {
  db.update(databaseName, "bitscreen", req.body)
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
  db.remove(databaseName, "bitscreen", parseInt(req.params.id))
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
  db.findBy(databaseName, "bitscreen", [
    {
      field: "_cryptId",
      value: req.params._cryptId,
    },
  ])
    .then((data) => {
      if (data.length === 0) {
        res.status(404).send([]);
        return;
      }

      // don't rehash cids fetched from another origin
      if (data[0].origin) {
        res.send(data[0]);
      } else {
        res.send(
          data.map((x) => {
            let y = JSON.parse(JSON.stringify(x));
            y.cids = x.cids.map(getAddressHash);
            return y;
          })[0]
        );
      }
    })
    .catch(() => {
      res.status(500).send([]);
    });
});

app.get("/filters/shared/:_cryptId/version", (req: Request, res: Response) => {
  db.findBy(databaseName, "bitscreen", [
    {
      field: "_cryptId",
      value: req.params._cryptId,
    },
  ])
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
    });
});

app.get("/filters/public", (req: Request, res: Response) => {
  const itemsPerPage = parseInt(req.query.per_page as any);
  const page = parseInt(req.query.page as any);
  const sorting = (JSON.parse(req.query.sort as any) || {}) as any;
  const searchQuery = req.query.q as string;

  const computedSorting: SortingCriteria[] = [];

  Object.keys(sorting).map((key) => {
    computedSorting.push({
      field: key,
      direction: sorting[key],
    });
  });

  db.advancedFind(
    databaseName,
    "bitscreen",
    page,
    itemsPerPage,
    computedSorting,
    [
      {
        field: "visibility",
        value: "2",
      },
      {
        field: "override",
        value: "",
      },
    ],
    searchQuery,
    ["name", "description", "cids", "notes"]
  ).then((data) => {
    console.log("data length", data.length);
    res.send(
      data.map((x) => {
        let y = JSON.parse(JSON.stringify(x));

        if (y.cids) {
          y.cids = y.cids.map(getAddressHash);
        }

        return y;
      })
    );
  });
});

app.get("/filters/public/count", (req: Request, res: Response) => {
  db.findBy(databaseName, "bitscreen", [
    {
      field: "visibility",
      value: "2",
    },
    {
      field: "override",
      value: "",
    },
  ]).then(async (data) => {
    const filteredData = await db.filterInColumns(data, req.query.q as string, [
      "name",
      "description",
      "cids",
      "notes",
    ]);

    res.send({
      count: filteredData.length,
    });
  });
});

app.get(
  "/cid/is-override-remote/:_filterId/:cid",
  (req: Request, res: Response) => {
    db.checkOverriddenCid(
      databaseName,
      "bitscreen",
      req.params.cid,
      req.params._filterId
    )
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        console.log("Version error log", err);
        res.status(404).send({});
      });
  }
);

app.get(
  "/cid/is-override-local/:_filterId/:cid",
  (req: Request, res: Response) => {
    db.checkOverriddenCid(
      databaseName,
      "bitscreen",
      req.params.cid,
      req.params._filterId,
      true
    )
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        console.log("Version error log", err);
        res.status(404).send({});
      });
  }
);

app.post("/cids/override/:_filterId", (req: Request, res: Response) => {
  const cids = req.body || [];

  Promise.all(
    cids.map((x) =>
      db.checkOverriddenCid(
        databaseName,
        "bitscreen",
        x,
        req.params._filterId,
        true
      )
    )
  ).then((results) => {
    res.send(
      cids.filter((item, index) => {
        return !!results[index];
      })
    );
  });
});

app.get("/provider_info", (req: Request, res: Response) => {
  db.findAll(databaseName, "provider_info")
    .then((results) => {
      if (results.length > 0) {
        res.send(results[0]);
      } else {
        res.send({
          fileCoinAddress: "",
          businessName: "",
          website: "",
          email: "",
          contactPerson: "",
          address: "",
          country: "",
        });
      }
    })
    .catch((err) => {
      console.log("GET provider_info err is", err);
      res.status(503).send({});
    });
});

app.put("/provider_info", (req: Request, res: Response) => {
  db.findAll(databaseName, "provider_info")
    .then((results) => {
      if (results.length > 0) {
        const existing: any = results[0];

        const saveObject = {
          ...existing,
          ...req.body,
          _id: existing._id, // prevent frontend from injecting _id
          _cryptId: existing._cryptId, // prevent frontend from injecting _cryptId
        };

        db.update(databaseName, "provider_info", saveObject)
          .then(() => {
            res.send({});
          })
          .catch(() => {
            res.status(503).send({});
          });
      } else {
        db.insert(databaseName, "provider_info", req.body)
          .then(() => {
            res.send({});
          })
          .catch(() => {
            res.status(503).send({});
          });
      }
    })
    .catch((err) => {
      console.log("POST provider_info err is", err);
      res.status(503).send({});
    });
});

interface Filter {
  _id?: number;
  cids: string[];
  visibility: number;
  enabled: boolean;
  override: boolean;
  origin?: string;
  _cryptId?: string;
  _lastUpdatedAt?: number;
}

cron.schedule(
  "0 */4 * * *",
  () => {
    db.findAll(databaseName, "bitscreen").then((data) => {
      const external = (data as Filter[]).filter((x: Filter) => {
        return !!x.origin;
      });

      const promises = external.map(
        (importFilter: Filter) =>
          new Promise(async (resolve, reject) => {
            const version = (await axios.get(`${importFilter.origin}/version`))
              .data;

            if (
              !version._lastUpdatedAt ||
              (importFilter._lastUpdatedAt &&
                version._lastUpdatedAt > importFilter._lastUpdatedAt)
            ) {
              const updatedImportFilter = (await axios.get(importFilter.origin))
                .data;

              updatedImportFilter._id = importFilter._id;

              return await db.update(
                databaseName,
                "bitscreen",
                updatedImportFilter
              );
            } else {
              return importFilter._id;
            }
          })
      );

      Promise.all(promises).then((updated) => {
        console.log("Updated items:", promises.length);
      });
    });
  },
  true
);

app.listen(process.env.PORT || 3030);
