import { Request, Response, Application } from "express";
import ErrnoException = NodeJS.ErrnoException;
import {mkdirSync, writeFile, openSync, readFileSync} from "fs";

import * as db from './db';

const path = require("path");
const bodyParser = require("body-parser");

const express = require("express");
const cors = require("cors");

const app: Application = express();
const basePath = path.join(process.env.HOME || "", ".murmuration");
const configPath = path.join(basePath, "config");
const filterPath = path.join(basePath, "bitscreen");

try {mkdirSync(basePath);} catch(e) {}

try {
    const f = openSync(configPath, "r");
} catch(e) {
  console.log("writing default config file.");
  writeFile(
      configPath,
      JSON.stringify({ bitscreen: false, share: false, advanced: false, filter: "" }),
      (err: ErrnoException | null) => {
        if (err) return console.error(err);
      });
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
  const file = JSON.parse(readFileSync(configPath).toString('utf8'));

  const actionPromise = new Promise((resolve, reject) => {
    writeFile(
        configPath,
        JSON.stringify({...file, ...req.body}),
        (err: ErrnoException | null) => {
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
      .then(() => res.send({
        success: true,
      }))
      .catch((err) => res.send({
        success: false,
      }))
  ;
});

app.get("/filters", (req: Request, res: Response) => {
  // const options = {
  //   header: {
  //     "Content-Type": "text/plain",
  //   },
  // };
  // res.sendFile(filterPath, options);

    db.findAll('bitscreen')
        .then(data => res.send(data))
        .catch(err => res.send([]))
    ;
});

app.put("/filters", (req: Request, res: Response) => {
    const file = JSON.parse(readFileSync(filterPath).toString('utf8'));

    const actionPromise = new Promise((resolve, reject) => {

    writeFile(filterPath, JSON.stringify({...file, ...req.body}), (err: ErrnoException | null) => {
      // If an error occurred, show it and return
      if (err) {
        reject(err);
      } else {
        resolve([]);
      }
      // Successfully wrote binary contents to the file!
    });
  });

  actionPromise
      .then(() => res.send({
        success: true,
      }))
      .catch((err) => res.send({
        success: false,
      }))
  ;
});

app.listen(process.env.PORT || 3030);


