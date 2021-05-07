import fs from "fs";
import chai from "chai";
const { expect } = chai;

export const parseABI = (abiPath) => {
  expect(fs.existsSync(abiPath)).to.eq(true);
  const fileContent = fs.readFileSync(abiPath);
  const parsed = JSON.parse(fileContent.toString());
  return parsed.abi;
};
