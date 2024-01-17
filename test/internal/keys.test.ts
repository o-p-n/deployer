/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import { Buffer } from "deno_std_209/io/mod.ts";
import { join } from "deno_std/path/mod.ts";
import { CommandResult } from "dax";

import { GlobalOpts } from "../../src/internal/global.ts";
import { _internals, KeyOp, loadKey } from "../../src/internal/keys.ts";

describe("internal/keys", () => {
  let spyReadTextFile: mock.Spy | undefined;

  function stubReadTextFile(result: (path: string | URL) => Promise<string>) {
    spyReadTextFile = mock.stub(_internals, "readTextFile", result);
  }

  afterEach(() => {
    spyReadTextFile && !spyReadTextFile.restored && spyReadTextFile.restore();
  });

  describe("loadKey()", () => {
    it("loads a private key", async () => {
      stubReadTextFile((_) => Promise.resolve("private key content"));
      const result = await loadKey({
        env: "testing",
        identityDir: "/devel/identity",
      }, true);

      expect(result).to.equal("private key content");
      expect(spyReadTextFile).to.have.been.deep.calledWith([
        "/devel/identity/testing.key",
      ]);
    });
    it("loads a public key", async () => {
      stubReadTextFile((_) => Promise.resolve("public key content"));
      const result = await loadKey({
        env: "testing",
        identityDir: "/devel/identity",
      }, false);

      expect(result).to.equal("public key content");
      expect(spyReadTextFile).to.have.been.deep.calledWith([
        "/devel/identity/testing.pub.key",
      ]);
    });
  });

  describe("KeyOp", () => {
    describe("ctor", () => {
      it("creates with the given opts", () => {
        const config = {
          env: "testing",
          identityDir: "/devel/identity",
        };
        const result = new KeyOp(config);

        expect(result.config).to.equal(config);
      });
    });

    describe(".get{ Public | Private }Key()", () => {
      const config = {
        env: "testing",
        identityDir: "/devel/identity",
      };

      let spyLoadKey: mock.Spy;
      let op: KeyOp;

      beforeEach(() => {
        spyLoadKey = mock.stub(
          _internals,
          "loadKey",
          (cfg: GlobalOpts, isPrivate: boolean) =>
            Promise.resolve(
              `key for ${isPrivate ? "private" : "public"} ${cfg.env}`,
            ),
        );
      });

      afterEach(() => {
        spyLoadKey.restore();
      });

      beforeEach(() => {
        op = new KeyOp(config);
      });

      it("loads a public key once", async () => {
        let result = await op.getPublicKey();
        expect(result).to.equal("key for public testing");

        result = await op.getPublicKey();
        expect(result).to.equal("key for public testing");

        expect(spyLoadKey).to.have.been.called(1);
        expect(spyLoadKey).to.have.been.deep.calledWith([
          config,
          false,
        ]);
      });
      it("loads a private key once", async () => {
        let result = await op.getPrivateKey();
        expect(result).to.equal("key for private testing");

        result = await op.getPrivateKey();
        expect(result).to.equal("key for private testing");

        expect(spyLoadKey).to.have.been.called(1);
        expect(spyLoadKey).to.have.been.deep.calledWith([
          config,
          true,
        ]);
      });
    });

    describe(".encrypt()", () => {
      const config = {
        env: "testing",
        identityDir: "/devel/identity",
      };

      let op: KeyOp;

      let spyResolve: mock.Spy | undefined;
      let spyPublicKey: mock.Spy | undefined;
      let spyPrivateKey: mock.Spy | undefined;
      let spyReadFile: mock.Spy | undefined;
      let spyWriteFile: mock.Spy | undefined;
      let spyCreateExec: mock.Spy | undefined;

      function stubReadFile(data: Uint8Array) {
        spyReadFile = mock.stub(
          _internals,
          "readFile",
          () => Promise.resolve(data),
        );
      }

      function stubCreateExec(output: Uint8Array) {
        const orig = _internals.createExec;

        const result: CommandResult = new CommandResult(
          0,
          new Buffer(output),
          new Buffer(),
          new Buffer(output),
        );
        spyCreateExec = mock.stub(
          _internals,
          "createExec",
          (...args) => {
            const cmd = orig(...args);
            mock.stub(cmd, "then", (onfulfilled, _onrejected) => {
              onfulfilled!(result);
              return cmd;
            });
            return cmd;
          },
        );
      }

      beforeEach(() => {
        spyResolve = mock.stub(
          _internals,
          "resolve",
          (...args) => join(...args),
        );
        spyWriteFile = mock.stub(_internals, "writeFile");

        op = new KeyOp(config);
        spyPublicKey = mock.stub(
          op,
          "getPublicKey",
          () => Promise.resolve("public key contents"),
        );
        spyPrivateKey = mock.stub(
          op,
          "getPrivateKey",
          () => Promise.resolve("private key contents"),
        );
      });

      afterEach(() => {
        spyResolve && !spyResolve.restored && spyResolve.restore();
        spyReadFile && !spyReadFile.restored && spyReadFile.restore();
        spyWriteFile && !spyWriteFile.restored && spyWriteFile.restore();
        spyCreateExec && !spyCreateExec.restored && spyCreateExec.restore();
        spyPublicKey && !spyPublicKey.restored && spyPublicKey.restore();
        spyPrivateKey && !spyPrivateKey.restored && spyPrivateKey.restore();
      });

      it("encrypts a file", async () => {
        const ptext = new TextEncoder().encode("plaintext");
        const ctext = new TextEncoder().encode("ciphertext");

        stubReadFile(ptext);
        stubCreateExec(ctext);
        await op.encrypt("secrets.env");

        expect(spyPublicKey).to.have.been.deep.calledWith([]);
        expect(spyReadFile).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env",
        ]);
        expect(spyWriteFile).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env.sops",
          ctext,
        ]);
        expect(spyCreateExec).to.have.been.deep.calledWith([
          "sops --encrypt /dev/stdin",
          ptext,
          {
            "SOPS_AGE_RECIPIENTS": "public key contents",
          },
        ]);
      });
      it("decrypts a file", async () => {
        const ptext = new TextEncoder().encode("plaintext");
        const ctext = new TextEncoder().encode("ciphertext");

        stubReadFile(ctext);
        stubCreateExec(ptext);
        await op.decrypt("secrets.env");

        expect(spyPrivateKey).to.have.been.deep.calledWith([]);
        expect(spyReadFile).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env.sops",
        ]);
        expect(spyWriteFile).to.have.been.deep.calledWith([
          "k8s/env/testing/secrets.env",
          ptext,
        ]);
        expect(spyCreateExec).to.have.been.deep.calledWith([
          "sops --decrypt /dev/stdin",
          ctext,
          {
            "SOPS_AGE_KEY": "private key contents",
          },
        ]);
      });
    });
  });
});
