/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { KeyOp } from "../internal/keys.ts";
import { Applier, ApplyOpts } from "../internal/k8s.ts";

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

async function handler(opts: ApplyOpts) {
  const k8s = new Applier(opts);

  await k8s.execute();
}
