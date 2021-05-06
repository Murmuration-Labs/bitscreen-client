import { Request, Response, Application } from "express";
import ErrnoException = NodeJS.ErrnoException;
import { mkdirSync, writeFile, openSync } from "fs";

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
  writeFile(
    configPath,
    JSON.stringify(req.body),
    (err: ErrnoException | null) => {
      // If an error occurred, show it and return
      if (err) return console.error(err);
      // Successfully wrote binary contents to the file!
    }
  );
});

app.get("/filters", (req: Request, res: Response) => {
  const options = {
    header: {
      "Content-Type": "application/json",
    },
  };
  res.sendFile(filterPath, options);
});

app.put("/filters", (req: Request, res: Response) => {
  console.log("saving filters: " + JSON.stringify({...req.body}));
  writeFile(filterPath, JSON.stringify({...req.body}), (err: ErrnoException | null) => {
    // If an error occurred, show it and return
    if (err) return console.error(err);
    // Successfully wrote binary contents to the file!
  });
});

app.listen(process.env.PORT || 3030);
