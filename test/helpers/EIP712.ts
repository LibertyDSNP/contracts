import { ethers } from "hardhat";

type EIP712Signature = { r: string; s: string; v: string };

export const signEIP712 = async (signer, domain, types, message): Promise<EIP712Signature> => {
  const sig = await signer._signTypedData(domain, types, message);
  return {
    r: "0x" + sig.substring(2).substring(0, 64),
    s: "0x" + sig.substring(2).substring(64, 128),
    v: "0x" + sig.substring(2).substring(128, 130),
  };
};

// The following functions should only be used for debugging

function abiRawEncode(types: ReadonlyArray<string>, values: ReadonlyArray<any>): Buffer {
  const hexStr = ethers.utils.defaultAbiCoder.encode(types, values);
  return Buffer.from(hexStr.slice(2, hexStr.length), "hex");
}

function keccak256(arg): Buffer {
  const hexStr = ethers.utils.keccak256(arg);
  return Buffer.from(hexStr.slice(2, hexStr.length), "hex");
}

type ValueType = { name: string; type: string };
type StructType = Array<ValueType>;
type TypeDeclaration = { [property: string]: StructType };

// Recursively finds all the dependencies of a type
function dependencies(primaryType: string, found: Array<string> = [], types: TypeDeclaration = {}) {
  if (found.includes(primaryType)) {
    return found;
  }
  if (types[primaryType] === undefined) {
    return found;
  }
  found.push(primaryType);
  for (let field of types[primaryType]) {
    for (let dep of dependencies(field.type, found)) {
      if (!found.includes(dep)) {
        found.push(dep);
      }
    }
  }
  return found;
}

export function encodeType(primaryType: string, types: TypeDeclaration = {}): string {
  // Get dependencies primary first, then alphabetical
  let deps = dependencies(primaryType);
  deps = deps.filter((t) => t != primaryType);
  deps = [primaryType].concat(deps.sort());

  // Format as a string with fields
  let result = "";
  for (let type of deps) {
    if (!types[type])
      throw new Error(`Type '${type}' not defined in types (${JSON.stringify(types)})`);
    result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(",")})`;
  }
  return result;
}

export function typeHash(primaryType: string, types: TypeDeclaration = {}): Buffer {
  return keccak256(Buffer.from(encodeType(primaryType, types)));
}

export function encodeData(
  primaryType: string,
  data: Record<string, any>,
  types: TypeDeclaration = {}
): Buffer {
  let encTypes: Array<string> = [];
  let encValues: Array<Buffer> = [];

  // Add typehash
  encTypes.push("bytes32");
  encValues.push(typeHash(primaryType, types));

  // Add field contents
  for (let field of types[primaryType]) {
    let value = data[field.name];
    if (field.type == "string" || field.type == "bytes") {
      encTypes.push("bytes32");
      value = keccak256(Buffer.from(value));
      encValues.push(value);
    } else if (types[field.type] !== undefined) {
      encTypes.push("bytes32");
      value = keccak256(encodeData(field.type, value, types));
      encValues.push(value);
    } else if (field.type.lastIndexOf("]") === field.type.length - 1) {
      throw "TODO: Arrays currently unimplemented in encodeData";
    } else {
      encTypes.push(field.type);
      encValues.push(value);
    }
  }

  return abiRawEncode(encTypes, encValues);
}

export function domainSeparator(domain: Record<string, any>): Buffer {
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
    ].filter((a) => domain[a.name]),
  };
  return keccak256(encodeData("EIP712Domain", domain, types));
}

function structHash(
  primaryType: string,
  data: Record<string, any>,
  types: TypeDeclaration = {}
): Buffer {
  return keccak256(encodeData(primaryType, data, types));
}

export function digestToSign(
  domain: Record<string, any>,
  primaryType: string,
  message: Record<string, any>,
  types: TypeDeclaration = {}
): Buffer {
  return keccak256(
    Buffer.concat([
      Buffer.from("1901", "hex"),
      domainSeparator(domain),
      structHash(primaryType, message, types),
    ])
  );
}

async function sign(
  domain: Record<string, any>,
  primaryType: string,
  message: Record<string, any>,
  types: TypeDeclaration = {},
  signer: any
): Promise<Record<string, string>> {
  let signature;

  try {
    if (signer._signingKey) {
      const digest = digestToSign(domain, primaryType, message, types);
      signature = signer._signingKey().signDigest(digest);
      signature.v = "0x" + signature.v.toString(16);
    } else {
      const address = await signer.getAddress();
      const msgParams = JSON.stringify({ domain, primaryType, message, types });

      signature = await signer.provider.jsonRpcFetchFunc("eth_signTypedData_v4", [
        address,
        msgParams,
      ]);

      const r = "0x" + signature.substring(2).substring(0, 64);
      const s = "0x" + signature.substring(2).substring(64, 128);
      const v = "0x" + signature.substring(2).substring(128, 130);

      signature = { r, s, v };
    }
  } catch (e) {
    throw new Error(e);
  }

  return signature;
}
