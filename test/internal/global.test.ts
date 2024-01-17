/** */

import { afterEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import { Command } from "cliffy/command/mod.ts";
import { _internals, globalCommand } from "../../src/internal/global.ts";

describe("internal/global", () => {
  describe("globalCommand()", () => {
    let spyGetEnv: mock.Spy | undefined;

    afterEach(() => {
      spyGetEnv && !spyGetEnv.restored && spyGetEnv.restore();
    });

    function stubGetEnv(value: string) {
      spyGetEnv = mock.stub(_internals, "getEnv", () => value);
    }

    it("creates with the expected parameters (default)", () => {
      const result: Command = globalCommand();
      expect(result.getName()).to.equal("deployer");
      expect(result.getDescription()).to.equal(
        "Tool for deploying resources to outer-planes.net",
      );

      let opt;
      opt = result.getOption("env");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["e"]);
      expect(opt?.typeDefinition).to.equal("<env:string>");
      expect(opt?.required).to.be.true();
      expect(opt?.global).to.be.true();

      opt = result.getOption("identity-dir");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["I"]);
      expect(opt?.typeDefinition).to.equal("<identities:file>");
      expect(opt?.default).to.equal(Deno.cwd());
      expect(opt?.global).to.be.true();

      const cmd = result.getCommand("help");
      expect(cmd).to.exist();
    });
    it("creates with the expected parameters (env-var)", () => {
      const envvar = "/from-env/identities";
      stubGetEnv(envvar);

      const result: Command = globalCommand();
      expect(result.getName()).to.equal("deployer");
      expect(result.getDescription()).to.equal(
        "Tool for deploying resources to outer-planes.net",
      );

      let opt;
      opt = result.getOption("env");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["e"]);
      expect(opt?.typeDefinition).to.equal("<env:string>");
      expect(opt?.required).to.be.true();
      expect(opt?.global).to.be.true();

      opt = result.getOption("identity-dir");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["I"]);
      expect(opt?.typeDefinition).to.equal("<identities:file>");
      expect(opt?.default).to.equal("/from-env/identities");
      expect(opt?.global).to.be.true();
    });
  });
});
