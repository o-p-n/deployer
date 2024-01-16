/** */

import { Command } from "cliffy/command/mod.ts";
import { globalCommand } from "./internal/global.ts";
import { encryptCommand } from "./cmd/encrypt.ts";

export function createCommand() {
  let cli: Command = globalCommand();
  cli = encryptCommand(cli);

  return cli;
}

if (import.meta.main) {
  await createCommand().parse();
}
