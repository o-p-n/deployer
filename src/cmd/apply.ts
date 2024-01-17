/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";

export const _internals = {
  createKeyOp,
};

function createKeyOp(config: GlobalOpts): KeyOp {
  return new KeyOp(config);
}

export function applyCommand(global: Command<GlobalOpts>): Command<GlobalOpts> {
  return global.command("apply")
    .description("apply resources for the given environment")
    .option("--bootstrap, -b [bootstrap:boolean]", "also apply bootstrap", {
      default: false,
    })
    .action(handler)
    .reset();
}

interface ApplyOpts extends GlobalOpts {
  bootstrap: unknown;
}
function handler(_config: ApplyOpts) {
  // decrypt env secrets
  // apply bootstrap (if requested)
  // verify bootstrap applied
  // apply {env}
  // verify {env} applied
  // cleanup?
  console.log(_config);
}
