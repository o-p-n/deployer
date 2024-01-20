/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocked.ts";

import { Command } from "cliffy/command/mod.ts";
import { _internals, createCommand, main } from "../src/main.ts";

describe("main", () => {
  describe("createCommand()", () => {
    it("creates the command", () => {
      const result = createCommand();

      let opt;
      opt = result.getOption("env");
      expect(opt).to.exist();

      opt = result.getOption("identity-dir");
      expect(opt).to.exist();

      let cmd;
      cmd = result.getCommand("help");
      expect(cmd).to.exist();

      cmd = result.getCommand("encrypt");
      expect(cmd).to.exist();

      cmd = result.getCommand("decrypt");
      expect(cmd).to.exist();

      cmd = result.getCommand("apply");
      expect(cmd).to.exist();
    });
  });

  describe("main()", () => {
    let spyCreateCommand: mock.Spy;
    let spyCommandBuilderParse: mock.Spy;

    beforeEach(() => {
      spyCreateCommand = mock.spy(_internals, "createCommand");
      spyCommandBuilderParse = mock.stub(Command.prototype, "parse");
    });

    afterEach(() => {
      spyCreateCommand && !spyCreateCommand.restored &&
        spyCreateCommand.restore();
      spyCommandBuilderParse && !spyCommandBuilderParse.restored &&
        spyCommandBuilderParse.restore();
    });

    it("executes main", async () => {
      _internals.main = true;

      await main();
      expect(spyCreateCommand).to.be.called(1);
      expect(spyCommandBuilderParse).to.be.called(1);
    });
  });
});
