/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import { Command } from "cliffy/command/mod.ts";

import { globalCommand, GlobalOpts } from "../../src/internal/global.ts";
import { _internals, encryptCommand } from "../../src/cmd/encrypt.ts";

describe("cmd/encrypt", () => {
  // deno-lint-ignore no-explicit-any
  let global: any & Command;

  beforeEach(() => {
    global = globalCommand();
  });

  describe("encryptCommand", () => {
    let spyCreateKeyOp: mock.Spy | undefined;
    let spyEncrypt: mock.Spy | undefined;

    beforeEach(() => {
      const createKeyOp = _internals.createKeyOp;
      spyCreateKeyOp = mock.stub(
        _internals,
        "createKeyOp",
        (opts: GlobalOpts) => {
          const op = createKeyOp(opts);
          spyEncrypt = mock.stub(op, "encrypt");
          return op;
        },
      );
    });

    afterEach(() => {
      spyCreateKeyOp && !spyCreateKeyOp.restored && spyCreateKeyOp.restore();
    });

    it("creates with expected parameters", () => {
      const result = encryptCommand(global);

      const encrypt = result.getCommand("encrypt");
      expect(encrypt).to.exist();
      expect(encrypt?.getName()).to.equal("encrypt");
      expect(encrypt?.getArgsDefinition()).to.equal("<file:file>");

      let opt;

      opt = encrypt?.getGlobalOption("env");
      expect(opt).to.exist();

      opt = encrypt?.getGlobalOption("identity-dir");
      expect(opt).to.exist();
    });

    it("calls the handler on parse", async () => {
      const cmd = encryptCommand(global);
      await cmd.parse([
        "encrypt",
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
      expect(spyEncrypt).to.have.been.deep.calledWith([
        "secrets.env",
      ]);
    });
  });
});
