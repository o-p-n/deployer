/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

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

      it("decrypts single found", async () => {
        stubGlob("k8s/env/testing/secrets.env.sops");

        const applier = new Applier(opts);
        await applier.decrypt();
        expect(applier.dirty).to.deep.equal([
          "k8s/env/testing/secrets.env",
        ]);

        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env.sops",
          true,
        ]);
      });
      it("decrypts all found", async () => {
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
          true,
        ]);
        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/private.key.sops",
          true,
        ]);
        expect(spyKeyOpDecrypt).to.have.been.deep.calledWith([
          "k8s/env/testing/privacy.txt.sops",
          true,
        ]);
      });
      it("decrypts nothing", async () => {
        stubGlob();

        const applier = new Applier(opts);
        await applier.decrypt();
        expect(applier.dirty).to.deep.equal([]);

        expect(spyKeyOpDecrypt).to.not.have.been.called();
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

      function stubBootstrapExists() {
        spyExists = mock.stub(
          _internals,
          "exists",
          () => Promise.resolve(true),
        );
      }

      function stubBootstrapMissing() {
        spyExists = mock.stub(
          _internals,
          "exists",
          () => Promise.resolve(false),
        );
      }

      it("calls the submethods (no bootstrap)", async () => {
        stubBootstrapExists();
        const applier = new Applier(opts);
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

        expect(spyExists).to.have.not.been.called();

        expect(spyApplyKustomize).to.have.been.called(1);
        expect(spyApplyKustomize).to.have.been.deep.calledWith([
          "k8s/env/testing",
        ]);

        expect(spyCleanup).to.have.been.called(1);
      });
      it("calls the submethods (with bootstrap, and exists)", async () => {
        stubBootstrapExists();
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

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
        stubBootstrapMissing();
        const applier = new Applier({
          ...opts,
          bootstrap: true,
        });
        await applier.execute();

        expect(spyDecrypt).to.have.been.called(1);

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
    });
  });
});
