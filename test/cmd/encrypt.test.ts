/** */

import { beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect } from "../mocked.ts";

import { Command } from "cliffy/command/mod.ts";

import { globalCommand } from "../../src/internal/global.ts";
import { _internals, encryptCommand } from "../../src/cmd/encrypt.ts";

describe("cmd/encrypt", () => {
  // deno-lint-ignore no-explicit-any
  let global: any & Command;

  beforeEach(() => {
    global = globalCommand();
  });

  describe("encryptCommand", () => {
    it("creates with expected parameters", () => {
      const result: Command = encryptCommand(global);

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
  });
});
