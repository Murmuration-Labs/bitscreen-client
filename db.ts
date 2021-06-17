import { mkdirSync, writeFile, openSync, readFileSync } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import moment from "moment";

import { getAddressHash } from "./crypto_lib";

const basePath = path.join(process.env.HOME || "", ".murmuration2");
const databases = {
  local_database: {
    name: "local_database",
    basePath: basePath,
    dbPath: path.join(basePath, "local_database"),
    tables: ["config", "bitscreen", "provider_info"],
  },
  complaints: {
    name: "complaints",
    basePath: basePath,
    dbPath: path.join(basePath, "complaints_database"),
    tables: ["complaints"],
  },
};

let dbFileData: any = {};

Object.keys(databases).forEach((database) => {
  try {
    openSync(databases[database].basePath, "r");
  } catch (e) {
    try {
      console.log("Folder for database missing, attempting to create...");
      mkdirSync(databases[database].basePath);
    } catch (e2) {
      console.log("Could not create local folder for the database", e2);
    }
  }

  try {
    openSync(databases[database].dbPath, "r");

    dbFileData[databases[database].name] = JSON.parse(
      readFileSync(databases[database].dbPath).toString("utf8")
    );
  } catch (e) {
    databases[database].tables.forEach((table) => {
      if (!dbFileData[databases[database].name]) {
        dbFileData[databases[database].name] = {};
      }
      dbFileData[databases[database].name][table] = {
        name: table,
        data: {}, // object in order to index better
        nextInsertId: 1,
      };
    });
  } finally {
    databases[database].tables.forEach((table) => {
      if (!dbFileData[databases[database].name].hasOwnProperty(table)) {
        dbFileData[databases[database].name][table] = {
          name: table,
          data: {},
          nextInsertId: 1,
        };
      }
    });
  }
});

function forceExistingTable(databaseName: string, table: string) {
  if (!Object.prototype.hasOwnProperty.call(dbFileData[databaseName], table)) {
    throw new Error(`Attempting to interact with unexisting table ${table}`);
  }
}

function forceExistingEntry(databaseName: string, table: string, _id: number) {
  if (
    !Object.prototype.hasOwnProperty.call(
      dbFileData[databaseName][table].data,
      _id
    )
  ) {
    throw new Error(
      `Attempting to interact with unexisting entry ${_id} from table ${table}`
    );
  }
}

const syncToDisk = (databaseName: string, resolveValue: any) =>
  new Promise((resolve, reject) => {
    writeFile(
      databases[databaseName].dbPath,
      JSON.stringify(dbFileData[databaseName]),
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

export const insert = async (
  databaseName: string,
  table: string,
  data: any
) => {
  forceExistingTable(databaseName, table);

  data._id = dbFileData[databaseName][table].nextInsertId;

  let token, existing;

  do {
    token = await generateRandomToken();
    existing = !!Object.keys(dbFileData[databaseName][table].data)
      .map((x) => dbFileData[databaseName][table].data[x])
      .find((x) => x._cryptId && x._cryptId === token);
  } while (existing);

  data._cryptId = token;
  data._lastUpdatedAt = moment().unix();

  dbFileData[databaseName][table].data[data._id] = data;
  dbFileData[databaseName][table].nextInsertId++;

  console.log(
    "Updated next insert id to",
    dbFileData[databaseName][table].nextInsertId
  );
  return await syncToDisk(databaseName, data._id);
};

export const update = async (
  databaseName: string,
  table: string,
  data: any
) => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  for (let i = 0; i < data.length; i++) {
    forceExistingTable(databaseName, table);
    forceExistingEntry(databaseName, table, data[i]._id);

    dbFileData[databaseName][table].data[data[i]._id] = {
      ...dbFileData[databaseName][table].data[data[i]._id], // keep old values
      ...data[i], // overwrite new
    };
    dbFileData[databaseName][table].data[data[i]._id]._lastUpdatedAt =
      moment().unix();
  }

  return await syncToDisk(databaseName, data._id);
};

export const remove = async (
  databaseName: string,
  table: string,
  _id: number
) => {
  forceExistingTable(databaseName, table);
  forceExistingEntry(databaseName, table, _id);

  delete dbFileData[databaseName][table].data[_id];
  return await syncToDisk(databaseName, null);
};

export const find = async (
  databaseName: string,
  table: string,
  _id: number
) => {
  forceExistingTable(databaseName, table);
  forceExistingEntry(databaseName, table, _id);

  return dbFileData[databaseName][table].data[_id];
};

export interface StringFilteringCriteria {
  field: string;
  value: string;
}

export const findBy = async (
  databaseName: string,
  table: string,
  criteria: StringFilteringCriteria[]
) => {
  forceExistingTable(databaseName, table);
  return Object.keys(dbFileData[databaseName][table].data)
    .filter((x) => {
      for (let i = 0; i < criteria.length; i++) {
        if (
          dbFileData[databaseName][table].data[x][criteria[i].field] !==
          criteria[i].value
        ) {
          return false;
        }
      }
      return true;
    })
    .map((x) => dbFileData[databaseName][table].data[x]);
};

// THIS can also be improved with pagination
// BUT we don't worry about this right now
export const findAll = async (databaseName: string, table: string) => {
  forceExistingTable(databaseName, table);

  return Object.values(dbFileData[databaseName][table].data);
};

export const searchInColumns = async (
  databaseName: string,
  table: string,
  searchTerm: string = "",
  searchInColumns: string[] = []
) => {
  forceExistingTable(databaseName, table);

  return Object.values(dbFileData[databaseName][table].data).filter(
    (item: any) => {
      if (!searchTerm) {
        return true;
      }

      let found = false;

      for (let i = 0; i < Object.keys(item).length; i++) {
        const itemKey = Object.keys(item)[i];

        if (
          (searchInColumns.length === 0 ||
            searchInColumns.indexOf(itemKey) > -1) &&
          item[itemKey].toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          found = true;
          break;
        }
      }

      return found;
    }
  );
};

export const searchFilter = async (
  databaseName: string,
  table: string,
  searchTerm?: string
) => {
  forceExistingTable(databaseName, table);

  return !searchTerm
    ? Object.values(dbFileData[databaseName][table].data)
    : Object.values(dbFileData[databaseName][table].data).filter(
        (element: any) => {
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
        }
      );
};

export const findById = async (
  databaseName: string,
  table: string,
  _id: number
) => {
  forceExistingTable(databaseName, table);
  const result = Object.values(dbFileData[databaseName][table].data).find(
    (element: any) => {
      return element._id == _id;
    }
  );
  return result ? result : false;
};

export const checkOverriddenCid = async (
  databaseName: string,
  table: string,
  cid: string
) => {
  forceExistingTable(databaseName, table);
  const hashedCid = getAddressHash(cid);
  return Object.values(dbFileData[databaseName][table].data).find(
      (element: any) => {
        if (
            element.override !== undefined &&
            element.override === false &&
            element.origin !== undefined &&
            element.origin !== null
        ) {
          return element.cids.indexOf(hashedCid) === -1 ? false : true;
        }
      }
  );
};
