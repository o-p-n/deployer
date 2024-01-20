/** */

import { Command } from "cliffy/command/mod.ts";
import { globalCommand } from "./internal/global.ts";
import { encryptCommand } from "./cmd/encrypt.ts";
import { decryptCommand } from "./cmd/decrypt.ts";
import { GlobalOpts } from "./internal/global.ts";

export const _internals = {
  createCommand,
  main: import.meta.main,
};

export function createCommand() {
  let cli: Command<GlobalOpts> = globalCommand();
  cli = encryptCommand(cli);
  cli = decryptCommand(cli);

  return cli;
}

export async function main() {
  if (_internals.main) {
    await _internals.createCommand().parse();
  }
}

await main();
