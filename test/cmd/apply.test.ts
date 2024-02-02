/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import { globalCommand, GlobalOpts } from "../../src/internal/global.ts";
import { Command } from "cliffy/command/mod.ts";

import { Applier } from "../../src/internal/k8s.ts";
import { _internals, applyCommand } from "../../src/cmd/apply.ts";

describe("cmd/apply", () => {
  let global: Command<GlobalOpts>;

  beforeEach(() => {
    global = globalCommand();
  });

  describe("applyCommand()", () => {
    let spyCreateApply: mock.Spy;
    let spyExecute: mock.Spy;

    beforeEach(() => {
      spyCreateApply = mock.spy(_internals, "createApplier");
      spyExecute = mock.stub(Applier.prototype, "execute");
    });

    afterEach(() => {
      spyCreateApply && !spyCreateApply.restored && spyCreateApply.restore();
      spyExecute && !spyExecute.restored && spyExecute.restore();
    });

    it("creates with expected parameters", () => {
      const result = applyCommand(global);

      const apply = result.getCommand("apply");
      expect(apply).to.exist();
      expect(apply?.getName()).to.equal("apply");
      expect(apply?.getArgsDefinition()).to.be.undefined();

      let opt;

      opt = apply?.getGlobalOption("env");
      expect(opt).to.exist();

      opt = apply?.getGlobalOption("identity-dir");
      expect(opt).to.exist();

      opt = apply?.getOption("bootstrap");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["b"]);
      expect(opt?.typeDefinition).to.equal("[bootstrap:boolean]");
      expect(opt?.default).to.be.false();

      opt = apply?.getOption("context");
      expect(opt).to.exist();
      expect(opt?.aliases).to.deep.equal(["C"]);
      expect(opt?.typeDefinition).to.equal("<context:string>");
      expect(opt?.default).to.equal("");
    });

    it("calls the handler on parse", async () => {
      const cmd = applyCommand(global);
      await cmd.parse([
        "apply",
        "--env",
        "testing",
      ]);

      expect(spyCreateApply).to.have.been.deep.calledWith([
        {
          env: "testing",
          identityDir: Deno.env.get("DEPLOYER_IDENTITY_DIR") || Deno.cwd(),
          bootstrap: false,
          context: "",
        },
      ]);
      expect(spyExecute).to.have.been.called(1);
    });
    it("calls the handler on parse (with bootstrapping)", async () => {
      const cmd = applyCommand(global);
      await cmd.parse([
        "apply",
        "--env",
        "testing",
        "--bootstrap",
      ]);

      expect(spyCreateApply).to.have.been.deep.calledWith([
        {
          env: "testing",
          identityDir: Deno.env.get("DEPLOYER_IDENTITY_DIR") || Deno.cwd(),
          bootstrap: true,
          context: "",
        },
      ]);
      expect(spyExecute).to.have.been.called(1);
    });
    it("calls the handler on parse (with explicit identity-dir)", async () => {
      const cmd = applyCommand(global);
      await cmd.parse([
        "apply",
        "--env",
        "testing",
        "--identity-dir",
        "/devel/identity",
      ]);

      expect(spyCreateApply).to.have.been.deep.calledWith([
        {
          env: "testing",
          identityDir: "/devel/identity",
          bootstrap: false,
          context: "",
        },
      ]);
      expect(spyExecute).to.have.been.called(1);
    });
    it("calls the handler on parse (with context)", async () => {
      const cmd = applyCommand(global);
      await cmd.parse([
        "apply",
        "--env",
        "testing",
        "--context",
        "testing",
      ]);

      expect(spyCreateApply).to.have.been.deep.calledWith([
        {
          env: "testing",
          identityDir: Deno.env.get("DEPLOYER_IDENTITY_DIR") || Deno.cwd(),
          bootstrap: false,
          context: "testing",
        },
      ]);
      expect(spyExecute).to.have.been.called(1);
    });
  });
});
