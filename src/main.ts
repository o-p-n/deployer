/** */

import { global } from "./internal/global.ts";

export function createCommand() {
  // deno-lint-ignore prefer-const
  let cli = global();

  return cli;
}

if (import.meta.main) {
  await createCommand().parse();
}
