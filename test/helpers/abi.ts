import fs from "fs";

export const parseABI = (abiPath) => {
  if (!fs.existsSync(abiPath)) throw new Error(`Unable to locate ${abiPath}`);
  const fileContent = fs.readFileSync(abiPath);
  const parsed = JSON.parse(fileContent.toString());
  return parsed.abi;
};
