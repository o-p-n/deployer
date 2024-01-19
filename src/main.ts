/** */

import { Command } from "cliffy/command/mod.ts";

import { globalCommand } from "./internal/global.ts";
import { applyCommand } from "./cmd/apply.ts";
import { encryptCommand } from "./cmd/encrypt.ts";
import { decryptCommand } from "./cmd/decrypt.ts";
import { GlobalOpts } from "./internal/global.ts";

export function createCommand() {
  let cli: Command<GlobalOpts> = globalCommand();
  cli = applyCommand(cli);
  cli = encryptCommand(cli);
  cli = decryptCommand(cli);

  return cli;
}

if (import.meta.main) {
  await createCommand().parse();
}
