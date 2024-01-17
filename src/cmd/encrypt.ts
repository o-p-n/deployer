/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";

export const _internals = {
  createKeyOp,
  handler,
};

function createKeyOp(config: GlobalOpts) {
  return new KeyOp(config);
}

export function encryptCommand(
  global: Command<GlobalOpts>,
): Command<GlobalOpts> {
  return global.command("encrypt <file:file>")
    .description("encrypts a data file for the given environment")
    .action(_internals.handler)
    .reset();
}

async function handler(config: GlobalOpts, file: string) {
  const op = _internals.createKeyOp(config);

  await op.encrypt(file);
}
