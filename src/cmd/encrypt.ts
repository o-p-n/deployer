/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";

export const _internals = {
  createKeyOp,
};

function createKeyOp(opts: GlobalOpts) {
  return new KeyOp(opts);
}

export function encryptCommand(
  global: Command<GlobalOpts>,
): Command<GlobalOpts> {
  return global.command("encrypt <file:file>")
    .description("encrypts a data file for the given environment")
    .action(handler)
    .reset();
}

async function handler(opts: GlobalOpts, file: string) {
  const op = _internals.createKeyOp(opts);

  await op.encrypt(file);
}
