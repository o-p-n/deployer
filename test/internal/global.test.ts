/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import pkg from "../../package.json" with { type: "json" };
import { globalCommand } from "../../src/internal/global.ts";

describe("internal/global", () => {
  describe("globalCommand()", () => {
    let origEnvVars: Record<string, string | undefined>;
    let spyExit: mock.Spy | undefined;

    function captureEnvVar(
      envs: Record<string, string | undefined>,
      key: string,
    ): Record<string, string | undefined> {
      envs = {
        ...envs,
        [key]: Deno.env.get(key),
      };
      Deno.env.delete(key);

      return envs;
    }

    beforeEach(() => {
      origEnvVars = captureEnvVar(origEnvVars, "DEPLOYER_IDENTITY_DIR");

      spyExit = mock.stub(Deno, "exit");
    });

    afterEach(() => {
      spyExit && !spyExit.restored && spyExit.restore();

      for (const [key, value] of Object.entries(origEnvVars)) {
        if (value !== undefined) {
          Deno.env.set(key, value);
        } else {
          Deno.env.delete(key);
        }
      }
    });

    it("creates with the expected parameters (default)", () => {
      const result = globalCommand();
      expect(result.getName()).to.equal(pkg.name);
      expect(result.getDescription()).to.equal(
        "Tool for deploying resources to outer-planes.net",
      );

      let opt;
      opt = result.getOption("env");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["e"]);
      expect(opt?.description).to.equal("the environment to operate on");
      expect(opt?.typeDefinition).to.equal("<env:string>");
      expect(opt?.required).to.be.true();
      expect(opt?.global).to.be.true();

      opt = result.getOption("identity-dir");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["I"]);
      expect(opt?.description).to.equal(
        "directory containing identities (public/private keys)",
      );
      expect(opt?.typeDefinition).to.equal("<identities:file>");
      expect(opt?.default).to.equal(Deno.cwd());
      expect(opt?.global).to.be.true();

      const envvar = result.getEnvVar("DEPLOYER_IDENTITY_DIR");
      expect(envvar).to.exist();
      expect(envvar?.name).to.equal("DEPLOYER_IDENTITY_DIR");
      expect(envvar?.description).to.equal(
        "set directory containing identities",
      );
      expect(envvar?.prefix).to.equal("DEPLOYER_");

      const cmd = result.getCommand("help");
      expect(cmd).to.exist();
    });

    it("parses the required options (no envvar)", async () => {
      const result = globalCommand();
      const args = await result.parse([
        "--env",
        "testing",
      ]);

      expect(args.options).to.deep.equal({
        env: "testing",
        identityDir: Deno.cwd(),
      });
    });
    it("parses the required options (with envvar)", async () => {
      Deno.env.set("DEPLOYER_IDENTITY_DIR", "/from/identities");
      const result = globalCommand();
      const args = await result.parse([
        "--env",
        "testing",
      ]);

      expect(args.options).to.deep.equal({
        env: "testing",
        identityDir: "/from/identities",
      });
    });

    it("parses all the options (no envvar)", async () => {
      const result = globalCommand();
      const args = await result.parse([
        "--env",
        "testing",
      ]);

      expect(args.options).to.deep.equal({
        env: "testing",
        identityDir: Deno.cwd(),
      });
    });
    it("parses the required options (with envvar)", async () => {
      Deno.env.set("DEPLOYER_IDENTITY_DIR", "/from/identities");
      const result = globalCommand();
      const args = await result.parse([
        "--env",
        "testing",
        "--identity-dir",
        "/devel/project/identities",
      ]);

      expect(args.options).to.deep.equal({
        env: "testing",
        identityDir: "/devel/project/identities",
      });
    });
  });
});
