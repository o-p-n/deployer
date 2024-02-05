/** */

import { join, relative, resolve, extname } from "deno_std/path/mod.ts";
import $ from "dax";

import { GlobalOpts } from "./global.ts";

export const _internals = {
  resolve,

  loadKey,

  readTextFile: Deno.readTextFile,
  readFile: Deno.readFile,
  writeFile: Deno.writeFile,
};

export async function loadKey(
  cfg: GlobalOpts,
  isPrivate: boolean,
): Promise<string> {
  const {
    env,
    identityDir,
  } = cfg;

  const fname = env + (isPrivate ? "" : ".pub") + ".key";
  const path = join(identityDir, fname);
  const content = await _internals.readTextFile(path);

  return content;
}

export class KeyOp {
  #cache = new Map<string, string>();

  readonly config: GlobalOpts;

  constructor(config: GlobalOpts) {
    this.config = config;
  }

  async getPublicKey() {
    const { env } = this.config;

    const key = `${env}/public`;
    let value = this.#cache.get(key);
    if (!value) {
      console.error(`🔑 loading ${env} public key`);
      value = await _internals.loadKey(this.config, false);
      this.#cache.set(key, value);
    }

    return value;
  }

  async getPrivateKey() {
    const { env } = this.config;

    const key = `${env}/private`;
    let value = this.#cache.get(key);
    if (!value) {
      console.error(`loading ${env} private key`);
      value = await _internals.loadKey(this.config, true);
      this.#cache.set(key, value);
    }

    return value;
  }

  async encrypt(file: string) {
    const { env } = this.config;
    const pubKey = await this.getPublicKey();

    const srcPath = relative(Deno.cwd(), file);
    const dstPath = `${srcPath}.sops`;
    console.log(`🔒 encrypting ${srcPath} for ${env}`);

    const src = await _internals.readFile(srcPath);
    const result = await $`sops --encrypt /dev/stdin`
      .printCommand()
      .stdin(src)
      .stdout("piped")
      .env({
        "SOPS_AGE_RECIPIENTS": pubKey,
      });
    await _internals.writeFile(dstPath, result.stdoutBytes);

    return dstPath;
  }

  async decrypt(file: string) {
    const { env } = this.config;
    const prvKey = await this.getPrivateKey();

    if (extname(file) === ".sops") {
      file = file.substring(0, file.length - 5);
    }
    const dstPath = relative(Deno.cwd(), file);
    const srcPath = `${dstPath}.sops`;
    console.log(`🔓 decrypting ${dstPath} for ${env}`);

    const src = await _internals.readFile(srcPath);
    const result = await $`sops --decrypt /dev/stdin`
      .printCommand()
      .stdin(src)
      .stdout("piped")
      .env({
        "SOPS_AGE_KEY": prvKey,
      });
    await _internals.writeFile(dstPath, result.stdoutBytes);

    return dstPath;
  }
}
