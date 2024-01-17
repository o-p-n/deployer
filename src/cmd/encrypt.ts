/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalConfig } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";

export const _internals = {
  createKeyOp,
  handler,
};

function createKeyOp(config: GlobalConfig) {
  return new KeyOp(config);
}

// deno-lint-ignore no-explicit-any
export function encryptCommand(global: any & Command): any {
  return global.command("encrypt <file:file>")
    .description("encrypts a data file for the given environment")
    .action(_internals.handler)
    .reset();
}

async function handler(config: GlobalConfig, file: string) {
  const op = _internals.createKeyOp(config);

  await op.encrypt(file);
}
