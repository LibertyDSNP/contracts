import chai from "chai";
import { main } from "../../scripts/src/deploy";
const { expect } = chai;

describe("Deploy Script", () => {
  it("doesn't reject", async () => {
    await expect(await main()).to.not.throw;
  });
});
