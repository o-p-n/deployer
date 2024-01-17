/** */

import { join, resolve } from "deno_std/path/mod.ts";
import { CommandBuilder, CommandResult } from "dax";

import { GlobalConfig } from "./global.ts";

export const _internals = {
  resolve,

  loadKey,

  readTextFile: Deno.readTextFile,
  readFile: Deno.readFile,
  writeFile: Deno.writeFile,

  CommandBuilder,
  createExec,
};

function createExec(
  command: string,
  stdin: Uint8Array,
  env: Record<string, string>,
): CommandBuilder {
  return new _internals.CommandBuilder()
    .command(command)
    .env(env)
    .stdin(stdin)
    .stdout("piped");
}

export async function loadKey(
  cfg: GlobalConfig,
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

  readonly config: GlobalConfig;

  constructor(config: GlobalConfig) {
    this.config = config;
  }

  async getPublicKey() {
    const { env } = this.config;

    const key = `${env}/public`;
    let value = this.#cache.get(key);
    if (!value) {
      console.error(`loading ${env} public key`);
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

    console.log(`encrypting ${file} for ${env} ...`);

    const srcPath = _internals.resolve("k8s", "env", env, file);
    const src = await _internals.readFile(srcPath);

    const pubKey = await this.getPublicKey();
    const result = await _internals.createExec(
      "sops --encrypt /dev/stdin",
      src,
      {
        "SOPS_AGE_RECIPIENTS": pubKey,
      },
    );

    const dstPath = `${srcPath}.sops`;
    await _internals.writeFile(dstPath, result.stdoutBytes);

    console.log(`... encrypted ${srcPath} → ${dstPath}`);
  }

  async decrypt(file: string) {
    const { env } = this.config;

    console.log(`decrypting ${file} for ${env}`);
    const dstPath = _internals.resolve("k8s", "env", env, file);

    const srcPath = `${dstPath}.sops`;
    const src = await _internals.readFile(srcPath);

    const prvKey = await this.getPrivateKey();
    const result = await _internals.createExec(
      "sops --decrypt /dev/stdin",
      src,
      {
        "SOPS_AGE_KEY": prvKey,
      },
    );

    await _internals.writeFile(dstPath, result.stdoutBytes);
    console.debug(`... decrypted ${srcPath} → ${dstPath}`);
  }
}
