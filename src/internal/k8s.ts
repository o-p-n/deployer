/** */

import { exists, expandGlob } from "deno_std/fs/mod.ts";
import { join, relative } from "deno_std/path/mod.ts";
import { CommandBuilder } from "dax";

import { GlobalOpts } from "./global.ts";
import { KeyOp } from "./keys.ts";

export const _internals = {
  cwd: Deno.cwd,
  exists,
  relative,
  remove: Deno.remove,

  expandGlob,
};

export interface ApplyOpts extends GlobalOpts {
  bootstrap: unknown;
  context?: string;
}

export class Applier {
  readonly config: ApplyOpts;

  #key: KeyOp;
  #dirty: string[];

  constructor(opts: ApplyOpts) {
    this.config = opts;
    this.#key = new KeyOp(opts);
    this.#dirty = [];
  }

  get dirty() {
    return [...this.#dirty];
  }

  async decrypt() {
    const base = join(_internals.cwd(), "k8s", "env", this.config.env);

    const decrypted: string[] = [];
    for await (const entry of _internals.expandGlob(`${base}\/**\/*.sops`)) {
      const path = _internals.relative(_internals.cwd(), entry.path);
      const dst = await this.#key.decrypt(path, true);
      decrypted.push(dst);
    }

    this.#dirty = decrypted;
  }

  async applyKustomize(path: string) {
    const { context } = this.config;
    const cmd = "kubectl";
    const args = [
      "apply",
      "--wait",
      `--kustomize="${path}"`,
    ];
    if (context) {
      args.unshift(`--context=${context}`);
    }

    await new CommandBuilder()
      .command([
        cmd,
        ...args,
      ])
      .printCommand();

    await this.verifyKustomize(path);
  }

  async verifyKustomize(path: string) {
    const { env } = this.config;

    // look for `apply-ready.sh`
    const checkCmd = join(path, "apply-ready.sh");
    const checkCmdPresent = await _internals.exists(checkCmd, {
      isFile: true,
    });
    if (checkCmdPresent) {
      await new CommandBuilder()
        .command(checkCmd)
        .printCommand()
        .env({ ENV: env });
    }
  }

  async cleanup() {
    for (const path of this.#dirty) {
      console.log(`deleting ${path}`);
      await _internals.remove(path);
    }
    this.#dirty = [];
  }

  async execute() {
    const { bootstrap, env } = this.config;

    // check requested environment exists
    const doit = await _internals.exists(`k8s/env/${env}`, {
      isDirectory: true,
      isReadable: true,
    });
    if (!doit) {
      console.log(`no resources for ${env}!`);
      // TODO: error?!
      return;
    }

    try {
      // decrypt secrets (if any)
      await this.decrypt();

      // apply bootstrap, if requested
      const doBootstrap = bootstrap &&
        await _internals.exists("k8s/bootstrap", {
          isDirectory: true,
          isReadable: true,
        });
      if (doBootstrap) {
        console.log("apply bootstrap");
        await this.applyKustomize("k8s/bootstrap");
      }

      // apply environment
      console.log(`apply ${env}`);
      await this.applyKustomize(`k8s/env/${env}`);
    } finally {
      // clean everything up
      await this.cleanup();
    }
  }
}
