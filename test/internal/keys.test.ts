/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { CommandBuilderStubber, expect, mock } from "../mocked.ts";

import { join } from "deno_std/path/mod.ts";

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

    describe(".encrypt()/.decrypt()", () => {
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

      const spyCommandBuilder = new CommandBuilderStubber();

      function stubReadFile(data: Uint8Array) {
        spyReadFile = mock.stub(
          _internals,
          "readFile",
          () => Promise.resolve(data),
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
        spyCommandBuilder.restore();

        spyResolve && !spyResolve.restored && spyResolve.restore();
        spyReadFile && !spyReadFile.restored && spyReadFile.restore();
        spyWriteFile && !spyWriteFile.restored && spyWriteFile.restore();
        spyPublicKey && !spyPublicKey.restored && spyPublicKey.restore();
        spyPrivateKey && !spyPrivateKey.restored && spyPrivateKey.restore();
      });

      describe("encrypting", () => {
        it("encrypts a file", async () => {
          const ptext = new TextEncoder().encode("plaintext");
          const ctext = new TextEncoder().encode("ciphertext");

          stubReadFile(ptext);
          spyCommandBuilder.apply({
            out: ctext,
          });
          const result = await op.encrypt("secrets.env");
          expect(result).to.equal("secrets.env.sops");

          expect(spyPublicKey).to.have.been.deep.calledWith([]);
          expect(spyReadFile).to.have.been.deep.calledWith([
            "secrets.env",
          ]);
          expect(spyWriteFile).to.have.been.deep.calledWith([
            "secrets.env.sops",
            ctext,
          ]);
          expect(spyCommandBuilder.promise).to.have.been.deep.called(1);
        });
      });

      describe("decrypting", () => {
        it("decrypts a file (assuming sops)", async () => {
          const ptext = new TextEncoder().encode("plaintext");
          const ctext = new TextEncoder().encode("ciphertext");

          stubReadFile(ctext);
          spyCommandBuilder.apply({
            out: ptext,
          });
          const result = await op.decrypt("secrets.env");
          expect(result).to.equal("secrets.env");

          expect(spyPrivateKey).to.have.been.deep.calledWith([]);
          expect(spyReadFile).to.have.been.deep.calledWith([
            "secrets.env.sops",
          ]);
          expect(spyWriteFile).to.have.been.deep.calledWith([
            "secrets.env",
            ptext,
          ]);
          expect(spyCommandBuilder.promise).to.have.been.called(1);
        });
        it("decrypts a file (extractin sops)", async () => {
          const ptext = new TextEncoder().encode("plaintext");
          const ctext = new TextEncoder().encode("ciphertext");

          stubReadFile(ctext);
          spyCommandBuilder.apply({
            out: ptext,
          });
          const result = await op.decrypt("secrets.env.sops");
          expect(result).to.equal("secrets.env");

          expect(spyPrivateKey).to.have.been.deep.calledWith([]);
          expect(spyReadFile).to.have.been.deep.calledWith([
            "secrets.env.sops",
          ]);
          expect(spyWriteFile).to.have.been.deep.calledWith([
            "secrets.env",
            ptext,
          ]);
          expect(spyCommandBuilder.promise).to.have.been.called(1);
        });
      });
    });
  });
});
