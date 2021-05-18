import { mkdirSync, writeFile, openSync, readFileSync } from "fs";
import * as path from "path";

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

export const insert = async (table: string, data: any) => {
  forceExistingTable(table);

  data._id = dbFileData[table].nextInsertId;

  dbFileData[table].data[data._id] = data;
  dbFileData[table].nextInsertId++;

  return await syncToDisk(data._id);
};

export const update = async (table: string, _id: number, data: any) => {
  forceExistingTable(table);
  forceExistingEntry(table, _id);

  dbFileData[table].data[data._id] = {
    ...dbFileData[table].data[data._id], // keep old values
    ...data, // overwrite new
  };

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
        return false;
      });
};
