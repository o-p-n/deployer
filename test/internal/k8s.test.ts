/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { CommandBuilderStubber, expect, mock } from "../mocked.ts";

import { type WalkEntry } from "deno_std/fs/mod.ts";
import { basename, dirname, join } from "deno_std/path/mod.ts";

import { KeyOp } from "../../src/internal/keys.ts";
import { _internals, Applier, ApplyOpts } from "../../src/internal/k8s.ts";

describe("internal/k8s", () => {
  describe("Applier", () => {
    const opts: ApplyOpts = {
      env: "testing",
      identityDir: "/devel/identity",
      bootstrap: false,
    };

    let spyCwd: mock.Spy;
    let spyExists: mock.Spy;
    let spyRelative: mock.Spy;
    let spyExpandGlob: mock.Spy;
    let spyKeyOpDecrypt: mock.Spy;

    beforeEach(() => {
      spyCwd = mock.stub(_internals, "cwd", () => ("/devel/module"));
      spyRelative = mock.stub(_internals, "relative", (_src, dst) => dst);
    });

    afterEach(() => {
      spyCwd && !spyCwd.restored && spyCwd.restore();
      spyExists && !spyExists.restored && spyExists.restore();
      spyRelative && !spyRelative.restored && spyRelative.restore();
      spyExpandGlob && !spyExpandGlob.restored && spyExpandGlob.restore();
      spyKeyOpDecrypt && !spyKeyOpDecrypt.restored && spyKeyOpDecrypt.restore();
    });

    describe("ctor", () => {
      it("creates with the given opts", () => {
        const config = {
          env: "testing",
          identityDir: "/devel/identity",
          bootstrap: false,
        };
        const result = new Applier(config);
        expect(result.config).to.equal(config);
        expect(result.dirty).to.deep.equal([]);
      });
    });

    describe(".decrypt()", () => {
      let spyRemove: mock.Spy;

      beforeEach(() => {
        spyRemove = mock.stub(_internals, "remove");
      });

      afterEach(() => {
        spyRemove && !spyRemove.restored && spyRemove.restore();
      });

      function stubGlob(...found: string[]) {
        const asyncIterable = {
          entries: found.map((v) => {
            return {
              name: basename(v),
              path: v,
              isFile: true,
              isDirectory: false,
              isSymlink: false,
            } as WalkEntry;
          }),

          [Symbol.asyncIterator]: async function* () {
            for (const entry of this.entries) {
              yield await Promise.resolve(entry);
            }
          },
        };

        spyExpandGlob = mock.stub(
          _internals,
          "expandGlob",
          () => (asyncIterable[Symbol.asyncIterator]()),
        );
        spyKeyOpDecrypt = mock.stub(
          KeyOp.prototype,
          "decrypt",
          (file: string) =>
            Promise.resolve(join(
              dirname(file),
              basename(file, ".sops"),
            )),
        );
      }

      it("decrypts single found (with cleanup)", async () => {
        stubGlob("k8s/env/testing/secrets.env.sops");

        const applier = new Applier(opts);
        await applier.decrypt();
        expect(applier.dirty).to.deep.equal([
          "k8s/env/testing/secrets.env",
        ]);

        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env.sops",
        ]);

        await applier.cleanup();
        expect(spyRemove).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env",
        ]);
        expect(applier.dirty).to.deep.equal([]);
      });
      it("decrypts all found (with cleanup)", async () => {
        stubGlob(
          "k8s/env/testing/secrets.env.sops",
          "k8s/env/testing/private.key.sops",
          "k8s/env/testing/privacy.txt.sops",
        );

        const applier = new Applier(opts);
        await applier.decrypt();
        expect(applier.dirty).to.deep.equal([
          "k8s/env/testing/secrets.env",
          "k8s/env/testing/private.key",
          "k8s/env/testing/privacy.txt",
        ]);

        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env.sops",
        ]);
        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/private.key.sops",
        ]);
        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/privacy.txt.sops",
        ]);

        await applier.cleanup();
        expect(spyRemove).to.have.been.called(3);
        expect(spyRemove).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env",
        ]);
        expect(spyRemove).to.have.been.deep.calledWith([
          "k8s/env/testing/private.key",
        ]);
        expect(spyRemove).to.have.been.deep.calledWith([
          "k8s/env/testing/privacy.txt",
        ]);
        expect(applier.dirty).to.deep.equal([]);
      });
      it("decrypts nothing (with cleanup)", async () => {
        stubGlob();

        const applier = new Applier(opts);
        await applier.decrypt();
        expect(applier.dirty).to.deep.equal([]);

        expect(spyKeyOpDecrypt).to.not.have.been.called();

        await applier.cleanup();
        expect(spyRemove).to.have.not.been.called();
        expect(applier.dirty).to.deep.equal([]);
      });
    });

    describe(".applyKustomize()", () => {
      const spyCommandBuilder = new CommandBuilderStubber();
      let spyVerifyKustomize: mock.Spy;

      beforeEach(() => {
        spyVerifyKustomize = mock.stub(Applier.prototype, "verifyKustomize");
      });

      afterEach(() => {
        spyCommandBuilder.restore();
        spyVerifyKustomize && !spyVerifyKustomize.restored &&
          spyVerifyKustomize.restore();
      });

      it("calls customize for the given path (no context)", async () => {
        const applier = new Applier(opts);

        spyCommandBuilder.apply({});
        await applier.applyKustomize("k8s/env/testing");
        expect(spyCommandBuilder.command).to.have.been.deep.calledWith([
          [
            "kubectl",
            "apply",
            "--wait",
            "--kustomize",
            "k8s/env/testing",
          ],
        ]);
        expect(spyCommandBuilder.promise).to.have.been.deep.called(1);
        expect(spyVerifyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);
      });
      it("calls customize for the given path (with context)", async () => {
        const applier = new Applier({
          ...opts,
          context: "testing",
        });

        spyCommandBuilder.apply({});
        await applier.applyKustomize("k8s/env/testing");
        expect(spyCommandBuilder.command).to.have.been.deep.calledWith([
          [
            "kubectl",
            "--context",
            "testing",
            "apply",
            "--wait",
            "--kustomize",
            "k8s/env/testing",
          ],
        ]);
        expect(spyCommandBuilder.promise).to.have.been.deep.called(1);
        expect(spyVerifyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);
      });
    });

    describe(".verifyKustomize", () => {
      const spyCommandBuilder = new CommandBuilderStubber();

      let spyExists: mock.Spy;

      afterEach(() => {
        spyExists && !spyExists.restored && spyExists.restore();
      });

      function stubCheckCmd(found: boolean) {
        spyExists = mock.stub(
          _internals,
          "exists",
          () => Promise.resolve(found),
        );
      }

      it("verifies via check command", async () => {
        const applier = new Applier(opts);

        stubCheckCmd(true);
        spyCommandBuilder.apply({});
        await applier.verifyKustomize("k8s/env/testing");
        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing/apply-ready.sh",
          { isFile: true },
        ]);
        expect(spyCommandBuilder.promise).to.have.been.called();
      });
      it("verify does nothing if missing check command", async () => {
        const applier = new Applier(opts);

        stubCheckCmd(false);
        spyCommandBuilder.apply({});
        await applier.verifyKustomize("k8s/env/testing");
        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing/apply-ready.sh",
          { isFile: true },
        ]);
        expect(spyCommandBuilder.promise).to.not.have.been.called();
      });
    });

    describe(".execute()", () => {
      let spyDecrypt: mock.Spy;
      let spyApplyKustomize: mock.Spy;
      let spyVerifyKustomize: mock.Spy;
      let spyCleanup: mock.Spy;

      afterEach(() => {
        spyDecrypt && !spyDecrypt.restored && spyDecrypt.restore();
        spyApplyKustomize && !spyApplyKustomize.restored &&
          spyApplyKustomize.restore();
        spyVerifyKustomize && !spyVerifyKustomize.restored &&
          spyVerifyKustomize.restore();
        spyCleanup && !spyCleanup.restored && spyCleanup.restore();
      });

      beforeEach(() => {
        spyDecrypt = mock.stub(Applier.prototype, "decrypt");
        spyApplyKustomize = mock.stub(Applier.prototype, "applyKustomize");
        spyVerifyKustomize = mock.stub(Applier.prototype, "verifyKustomize");
        spyCleanup = mock.stub(Applier.prototype, "cleanup");
      });

      function stubExists(paths: string[]) {
        const fn = (path: string | URL) => {
          if (paths.includes(path.toString())) {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        };
        spyExists = mock.stub(
          _internals,
          "exists",
          fn,
        );
      }

      it("calls the submethods (no bootstrapping)", async () => {
        stubExists([
          "k8s/bootstrap",
          "k8s/env/testing",
        ]);
        const applier = new Applier(opts);
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);

        expect(spyApplyKustomize).to.have.been.called(1);
        expect(spyApplyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);

        expect(spyCleanup).to.have.been.called(1);
      });
      it("calls the submethods (with bootstrap, and exists)", async () => {
        stubExists([
          "k8s/bootstrap",
          "k8s/env/testing",
        ]);
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);
        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/bootstrap",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);

        expect(spyApplyKustomize).to.have.been.called(2);
        expect(spyApplyKustomize).to.have.been.deep.calledWith([
          "k8s/bootstrap",
        ]);
        expect(spyApplyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);

        expect(spyCleanup).to.have.been.called(1);
      });
      it("calls the submethods (with bootstrap, but missing)", async () => {
        stubExists([
          "k8s/env/testing",
        ]);
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);
        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/bootstrap",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);

        expect(spyApplyKustomize).to.have.been.called(1);
        expect(spyApplyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);

        expect(spyCleanup).to.have.been.called(1);
      });
      it("calls some of the submethods (missing env)", async () => {
        stubExists([
          "k8s/bootstrap",
        ]);
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await applier.execute();

        expect(spyDecrypt).to.have.not.been.called();

        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);

        expect(spyApplyKustomize).to.have.not.been.called();

        expect(spyCleanup).to.have.not.been.called();
      });
      it("calls cleanup on error", async () => {
        spyDecrypt.restore();
        spyDecrypt = mock.stub(Applier.prototype, "decrypt", () => {
          return Promise.reject(new Error());
        });
        stubExists([
          "k8s/env/testing",
        ]);
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await expect(applier.execute()).to.be.rejected();

        expect(spyExists).to.have.been.deep.calledWith([
          "k8s/env/testing",
          {
            isDirectory: true,
            isReadable: true,
          },
        ]);
        // does not get to bootstrap check ...

        expect(spyDecrypt).to.have.been.called(1);
        expect(spyApplyKustomize).to.not.have.been.called();
        expect(spyCleanup).to.have.been.called(1);
      });
    });
  });
});
