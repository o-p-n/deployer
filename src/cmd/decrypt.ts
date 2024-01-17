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

export function decryptCommand(global: Command<GlobalOpts>): Command<GlobalOpts> {
  return global.command("decrypt <file:file>")
    .description("decrypts a data file for the given environment")
    .action(_internals.handler)
    .reset();
}

async function handler(config: GlobalOpts, file: string) {
  const op = _internals.createKeyOp(config);

  await op.decrypt(file);
}
