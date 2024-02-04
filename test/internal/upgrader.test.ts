/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "../mocked.ts";

import pkg from "../../package.json" with { type: "json" };
import vectors from "./releases.json" with { type: "json" };
import {
  _internals,
  assetSchema,
  parseAsset,
  parseRelease,
  releaseSchema,
  Upgrader,
} from "../../src/internal/upgrader.ts";

describe("internal/upgrader", () => {
  describe("parseAsset()", () => {
    it("parses the binary asset (no variant)", () => {
      const data = assetSchema.parse(vectors[0].assets[0]);

      const result = parseAsset(data)!;
      expect(result.name).to.equal("aarch64-apple-darwin");
      expect(result.url).to.equal(
        "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767953",
      );
      expect(result.digest).to.be.undefined();
    });
    it("parses the digest asset (no variant)", () => {
      const data = assetSchema.parse(vectors[0].assets[1]);

      const result = parseAsset(data)!;
      expect(result.name).to.equal("aarch64-apple-darwin");
      expect(result.digest).to.equal(
        "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767951",
      );
      expect(result.url).to.be.undefined();
    });

    it("parses the binary asset (with variant)", () => {
      const data = assetSchema.parse(vectors[0].assets[2]);

      const result = parseAsset(data)!;
      expect(result.name).to.equal("x86_64-unknown-linux-gnu");
      expect(result.url).to.equal(
        "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767950",
      );
      expect(result.digest).to.be.undefined();
    });
    it("parses the asset digest (with variant)", () => {
      const data = assetSchema.parse(vectors[0].assets[3]);

      const result = parseAsset(data)!;
      expect(result.name).to.equal("x86_64-unknown-linux-gnu");
      expect(result.digest).to.equal(
        "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767952",
      );
      expect(result.url).to.be.undefined();
    });

    it("returns undefined when name doesn't match", () => {
      const data = {
        name: "sources.zip",
        url: "https://example.com/sources.zip",
      };

      const result = parseAsset(data);
      expect(result).to.be.undefined();
    });
  });

  describe("parseRelease()", () => {
    it("parses a release", () => {
      const data = releaseSchema.parse(vectors[0]);

      const result = parseRelease(data);
      expect(result.name).to.equal("0.2.1");
      expect(result.binaries).to.deep.equal({
        "aarch64-apple-darwin": {
          name: "aarch64-apple-darwin",
          url:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767953",
          digest:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767951",
        },
        "x86_64-unknown-linux-gnu": {
          name: "x86_64-unknown-linux-gnu",
          url:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767950",
          digest:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767952",
        },
      });
    });

    it("parses a release (ignoring non-matching assets)", () => {
      const data = releaseSchema.parse(vectors[0]);
      data.assets.push({
        name: "sources.zip",
        url: "https://example.com/sources.zip",
      });

      const result = parseRelease(data);
      expect(result.name).to.equal("0.2.1");
      expect(result.binaries).to.deep.equal({
        "aarch64-apple-darwin": {
          name: "aarch64-apple-darwin",
          url:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767953",
          digest:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767951",
        },
        "x86_64-unknown-linux-gnu": {
          name: "x86_64-unknown-linux-gnu",
          url:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767950",
          digest:
            "https://api.github.com/repos/o-p-n/deployer/releases/assets/149767952",
        },
      });
    });
  });

  describe("Upgrader", () => {
    let spyFetch: mock.Spy;

    beforeEach(() => {
      spyFetch = mock.stub(_internals, "fetch", () => {
        const data = new TextEncoder().encode(JSON.stringify(vectors));
        const rsp = new Response(data, {
          status: 200,
        });
        return Promise.resolve(rsp);
      });
    });

    afterEach(() => {
      spyFetch && !spyFetch.restored && spyFetch.restore();
    });

    describe(".init()", () => {
      it("starts uninitialized", () => {
        const target = new Upgrader();
        expect(target.initialized).to.be.false();
      });

      it("initializes", async () => {
        const target = new Upgrader();
        const result = await target.init();

        expect(result).to.equal(target);
        expect(target.initialized).to.be.true();
        expect(spyFetch).to.have.been.deep.calledWith([
          `https://api.github.com/repos/${pkg.repository}/releases`,
        ]);
      });

      it("only initializes once", async () => {
        const target = new Upgrader();
        await target.init();
        const result = await target.init();

        expect(result).to.equal(target);
        expect(target.initialized).to.be.true();
        expect(spyFetch).to.have.been.called(1);
          expect(spyFetch).to.have.been.deep.calledWith([
          `https://api.github.com/repos/${pkg.repository}/releases`,
        ]);
      });

      it("throws if fetch fails", async () => {
        spyFetch.restore();
        spyFetch = mock.stub(_internals, "fetch", () => {
          const rsp = new Response(undefined, {
            status: 404,
          });

          return Promise.resolve(rsp);
        });

        const target = new Upgrader();
        await expect(target.init()).to.have.been.rejected();
      });
    });

    describe(".versions", () => {
      it("it throws when unitialized", () => {
        const target = new Upgrader();
        expect(() => {
          target.versions;
        }).to.throw();
      });

      it("returns all listed versions", async () => {
        const target = new Upgrader();
        await target.init();

        expect(target.versions).to.deep.equal([
          "0.2.1",
          "0.2.0",
          "0.1.1",
          "0.1.0",
        ]);
      });
    });
  });
});
