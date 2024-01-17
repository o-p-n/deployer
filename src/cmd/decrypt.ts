/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";

export const _internals = {
  createKeyOp,
  handler,
};

function createKeyOp(opts: GlobalOpts) {
  return new KeyOp(opts);
}

export function decryptCommand(
  global: Command<GlobalOpts>,
): Command<GlobalOpts> {
  return global.command("decrypt <file:file>")
    .description("decrypts a data file for the given environment")
    .action(_internals.handler)
    .reset();
}

async function handler(opts: GlobalOpts, file: string) {
  const op = _internals.createKeyOp(opts);

  await op.decrypt(file);
}
