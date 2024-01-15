/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocked.ts";

import { ValidationError } from "cliffy/command/mod.ts";
import { _internals, global } from "../src/cli.ts";

describe("cli", () => {
  describe("global()", () => {
    let spyGetEnv: mock.Spy;

    function createCLI() {
      return global()
        .noExit()
        .throwErrors();
    }

    beforeEach(() => {
      spyGetEnv = mock.spy(_internals, "getEnv");
    });

    afterEach(() => {
      spyGetEnv.restore();
    });

    it("returns on --help", async () => {
      const cli = createCLI();
      const stubShowHelp = mock.stub(cli, "showHelp");
      const result = await cli.parse(["--help"]);

      expect(result.options).to.deep.equal({
        help: true,
        identityDir: Deno.cwd(),
      });

      expect(stubShowHelp).to.have.been.called(1);
      expect(spyGetEnv).to.have.been.deep.calledWith([
        "DEPLOYER_IDENTITY_DIR",
      ]);
    });
    it("returns expected options with defaults", async () => {
      const result = await createCLI().parse(["--env", "local"]);

      expect(result.options).to.deep.equal({
        env: "local",
        identityDir: Deno.cwd(),
      });
      expect(spyGetEnv).to.have.been.deep.calledWith([
        "DEPLOYER_IDENTITY_DIR",
      ]);
    });
    it("returns expected options with explicit -I", async () => {
      const result = await createCLI().parse([
        "--env",
        "local",
        "--identity-dir",
        "/devel/infra/root",
      ]);

      expect(result.options).to.deep.equal({
        env: "local",
        identityDir: "/devel/infra/root",
      });
    });
    it("returns expected options with env-var", async () => {
      spyGetEnv.restore();
      spyGetEnv = mock.stub(
        _internals,
        "getEnv",
        (_: string) => ("/from-env/path"),
      );
      const result = await createCLI().parse([
        "--env",
        "local",
      ]);

      expect(result.options).to.deep.equal({
        env: "local",
        identityDir: "/from-env/path",
      });
    });

    it("throws on missing --env", async () => {
      const cli = createCLI();
      await expect(cli.parse([])).to.be.rejectedWith(ValidationError);
    });
  });
});
