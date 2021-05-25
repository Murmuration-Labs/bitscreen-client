import { mkdirSync, writeFile, openSync, readFileSync } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { getAddressHash } from "./crypto_lib";

const basePath = path.join(process.env.HOME || "", ".murmuration");
const dbPath = path.join(basePath, "local_database");

let dbFileData: any;

try {
  openSync(basePath, "r");
} catch (e) {
  try {
    console.log("Folder for database missing, attempting to create...");
    mkdirSync(basePath);
  } catch (e2) {
    console.log("Could not create local folder for the database", e2);
  }
}

try {
  openSync(dbPath, "r");

  dbFileData = JSON.parse(readFileSync(dbPath).toString("utf8"));
} catch (e) {
  dbFileData = {
    config: {
      name: "config",
      data: {}, // object in order to index better
      nextInsertId: 1,
    },
    bitscreen: {
      name: "bitscreen",
      data: {},
      nextInsertId: 1,
    },
    complaints: {
      name: "complaints",
      data: {},
      nextInsertId: 1,
    },
  };
}

function forceExistingTable(table: string) {
  if (!Object.prototype.hasOwnProperty.call(dbFileData, table)) {
    throw new Error(`Attempting to interact with unexisting table ${table}`);
  }
}

function forceExistingEntry(table: string, _id: number) {
  if (!Object.prototype.hasOwnProperty.call(dbFileData[table].data, _id)) {
    throw new Error(
      `Attempting to interact with unexisting entry ${_id} from table ${table}`
    );
  }
}

const syncToDisk = (resolveValue: any) =>
  new Promise((resolve, reject) => {
    writeFile(
      dbPath,
      JSON.stringify(dbFileData),
      // eslint-disable-next-line no-undef
      (err: NodeJS.ErrnoException | null) => {
        if (err) {
          reject(err);
        } else {
          resolve(resolveValue);
        }
      }
    );
  });

export const generateRandomHex = async (length = 2) =>
  new Promise<string>((resolve, reject) => {
    crypto.randomBytes(length, (err: Error | null, buffer: Buffer) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(buffer.toString("hex"));
    });
  });

export const generateRandomToken = async (bits = 4) => {
  const pieces: string[] = [];

  for (let i = 0; i < bits; i++) {
    const piece = await generateRandomHex();
    pieces.push(piece);
  }

  return pieces.join("-");
};

export const insert = async (table: string, data: any) => {
  forceExistingTable(table);

  data._id = dbFileData[table].nextInsertId;

  let token, existing;

  do {
    token = await generateRandomToken();
    existing = !!Object.keys(dbFileData[table].data)
      .map((x) => dbFileData[table].data[x])
      .find((x) => x._cryptId && x._cryptId === token);
  } while (existing);

  data._cryptId = token;

  dbFileData[table].data[data._id] = data;
  dbFileData[table].nextInsertId++;

  return await syncToDisk(data._id);
};

export const update = async (table: string, data: any) => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  for (let i = 0; i < data.length; i++) {
    forceExistingTable(table);
    forceExistingEntry(table, data[i]._id);

    dbFileData[table].data[data[i]._id] = {
      ...dbFileData[table].data[data[i]._id], // keep old values
      ...data[i], // overwrite new
    };
  }

  return await syncToDisk(data._id);
};

export const remove = async (table: string, _id: number) => {
  forceExistingTable(table);
  forceExistingEntry(table, _id);

  delete dbFileData[table].data[_id];
  return await syncToDisk(null);
};

export const find = async (table: string, _id: number) => {
  forceExistingTable(table);
  forceExistingEntry(table, _id);

  return dbFileData[table].data[_id];
};

export interface StringFilteringCriteria {
  field: string;
  value: string;
}

export const findBy = async (
  table: string,
  criteria: StringFilteringCriteria[]
) => {
  forceExistingTable(table);

  return Object.keys(dbFileData[table].data)
    .filter((x) => {
      for (let i = 0; i < criteria.length; i++) {
        if (
          dbFileData[table].data[x][criteria[i].field] !== criteria[i].value
        ) {
          return false;
        }
      }

      return true;
    })
    .map((x) => dbFileData[table].data[x]);
};

// THIS can also be improved with pagination
// BUT we don't worry about this right now
export const findAll = async (table: string) => {
  forceExistingTable(table);

  return Object.values(dbFileData[table].data);
};

export const searchFilter = async (table: string, searchTerm?: string) => {
  forceExistingTable(table);

  return !searchTerm
    ? Object.values(dbFileData[table].data)
    : Object.values(dbFileData[table].data).filter((element: any) => {
        if (element.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
        const util = element.cids.map((cid) => cid.toLowerCase());
        if (-1 != util.indexOf(searchTerm.toLowerCase())) {
          return true;
        }

        const hashedUtil = util.map(getAddressHash);
        if (-1 != hashedUtil.indexOf(searchTerm.toLowerCase())) {
          return true;
        }

        return false;
      });
};

export const findById = async (table: string, _id: number) => {
  forceExistingTable(table);
  const result = Object.values(dbFileData[table].data).find((element: any) => {
    return element._id == _id;
  });
  return result?result:false
};