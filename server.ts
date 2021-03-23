import { Request, Response, Application } from "express"
import ErrnoException = NodeJS.ErrnoException

const fs = require("fs")
const path = require("path")
const bodyParser = require("body-parser")

const express = require('express');
const cors = require('cors');

const app: Application = express()
const configPath = path.join(process.env.HOME || "", '.murmuration', 'config')

app.use(cors())
app.use(express.static(path.join(__dirname, 'build')))
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/ping', (req: Request, res: Response) => {
  return res.send('pong')
})

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

app.get('/config', (req: Request, res: Response) => {
  res.sendFile(configPath)
})

app.put('/config', (req: Request, res: Response) => {
  fs.writeFile(configPath,
    JSON.stringify(req.body), (err: ErrnoException | null) => {
      // If an error occurred, show it and return
      if (err) return console.error(err)
      // Successfully wrote binary contents to the file!
    })
})

app.listen(process.env.PORT || 8080)
