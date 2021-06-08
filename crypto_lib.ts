const keccak256 = require("keccak256");

export const getAddressHash = (input: string): string =>
  `0x${keccak256(input).toString("hex")}`;
