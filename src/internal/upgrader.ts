/** */

import { z } from "zod";
import * as semver from "deno_std/semver/mod.ts";
import pkg from "../../package.json" with { type: "json" };

export const _internals = {
  fetch,
};

const RE_RELEASE_DIST =
  /^(?:[a-zA-Z0-9][a-zA-Z0-9\-\.]+[a-zA-Z0-9])-(?:[0-9\.]+)-([a-zA-Z0-9\._]+)-([a-zA-Z0-9\._]+)-([a-zA-Z0-9\._]+)(?:-([a-zA-Z0-9\._]+))?\.tar\.gz(?:\.(sha256))?$/;

export const assetSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

export const releaseSchema = z.object({
  name: z.string(),
  assets: z.array(assetSchema),
});

export interface Release {
  name: string;
  binaries: Record<string, Asset>;
}

export function parseRelease(data: z.infer<typeof releaseSchema>): Release {
  const name = data.name.substring(1);

  const binaries: Record<string, Partial<Asset>> = {};
  for (const a of data.assets) {
    const bin = parseAsset(a);
    if (!bin) {
      continue;
    }

    const key = bin.name!;
    binaries[key] = {
      ...binaries[key],
      ...bin,
    };
  }

  return {
    name,
    binaries: binaries as Record<string, Asset>,
  };
}

export interface Asset {
  name: string;
  url: string;
  digest: string;
}

export function parseAsset(
  data: z.infer<typeof assetSchema>,
): Partial<Asset> | undefined {
  const current: Partial<Asset> = {};
  const { url, name } = data;
  const parts = RE_RELEASE_DIST.exec(name)?.slice(1);

  if (!parts) {
    return undefined;
  }
  const key = parts.slice(0, 4).filter((v) => v).join("-");
  const digest = parts[4] !== undefined;

  current.name = key;
  if (digest) {
    current.digest = url;
  } else {
    current.url = url;
  }

  return current;
}

export class Upgrader {
  #releases?: Record<string, Release>;

  constructor() {
    this.#releases = undefined;
  }

  get initialized(): boolean {
    return this.#releases !== undefined;
  }

  async init(): Promise<Upgrader> {
    if (this.initialized) {
      return this;
    }

    const response = await _internals.fetch(
      `https://api.github.com/repos/${pkg.repository}/releases`,
    );
    if (!response.ok) {
      throw new Error("no releases found");
    }

    const resultData = await response.json();
    const result: Record<string, Release> = {};

    for (const relData of resultData) {
      const rel = parseRelease(releaseSchema.parse(relData));
      result[rel.name] = rel;
    }
    this.#releases = result;

    return this;
  }

  get versions(): string[] {
    if (!this.initialized) {
      throw new Error("not initialized");
    }

    return Object.keys(this.#releases!);
  }

  available(current = pkg.version): string[] {
    if (!this.initialized) {
      throw new Error("not initialize");
    }

    if (current === "latest") {
      return [];
    }

    const have = semver.parse(current);
    const versions = this.versions.map((v) => semver.parse(v));
    const avail: string[] = [];
    for (const v of versions) {
      if (semver.greaterOrEqual(have, v)) {
        continue;
      }
      avail.push(semver.format(v));
    }

    return avail;
  }
}
