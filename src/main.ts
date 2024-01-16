/** */

import { Command } from "cliffy/command/mod.ts";
import { globalCommand } from "./internal/global.ts";

export function createCommand() {
  let cli: Command = globalCommand();

  return cli;
}

if (import.meta.main) {
  await createCommand().parse();
}
