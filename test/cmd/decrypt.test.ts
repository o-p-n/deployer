/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import { Command } from "cliffy/command/mod.ts";

import { globalCommand, GlobalOpts } from "../../src/internal/global.ts";
import { _internals, decryptCommand } from "../../src/cmd/decrypt.ts";

describe("cmd/decrypt", () => {
  // deno-lint-ignore no-explicit-any
  let global: any & Command;

  beforeEach(() => {
    global = globalCommand();
  });

  describe("encryptCommand", () => {
    let spyCreateKeyOp: mock.Spy | undefined;
    let spyDecrypt: mock.Spy | undefined;

    beforeEach(() => {
      const createKeyOp = _internals.createKeyOp;
      spyCreateKeyOp = mock.stub(
        _internals,
        "createKeyOp",
        (config: GlobalOpts) => {
          const op = createKeyOp(config);
          spyDecrypt = mock.stub(op, "decrypt");
          return op;
        },
      );
    });

    afterEach(() => {
      spyCreateKeyOp && !spyCreateKeyOp.restored && spyCreateKeyOp.restore();
    });

    it("creates with expected parameters", () => {
      const result = decryptCommand(global);

      const decrypt = result.getCommand("decrypt", true);
      expect(decrypt).to.exist();
      expect(decrypt?.getName()).to.equal("decrypt");
      expect(decrypt?.getArgsDefinition()).to.equal("<file:file>");

      let opt;

      opt = decrypt?.getGlobalOption("env");
      expect(opt).to.exist();

      opt = decrypt?.getGlobalOption("identity-dir");
      expect(opt).to.exist();

      expect(result.getCommand("decyrpt")).to.be.undefined();
    });

    it("calls the handler on parse", async () => {
      const cmd = decryptCommand(global);
      await cmd.parse([
        "decrypt",
        "--env",
        "testing",
        "secrets.env",
      ]);

      expect(spyCreateKeyOp).to.have.been.deep.calledWith([
        {
          env: "testing",
          identityDir: Deno.cwd(),
        },
      ]);
      expect(spyDecrypt).to.have.been.deep.calledWith([
        "secrets.env",
      ]);
    });
  });
});
