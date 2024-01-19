/** */

import { Command } from "cliffy/command/mod.ts";

import { GlobalOpts } from "../internal/global.ts";
import { Applier, ApplyOpts } from "../internal/k8s.ts";

export const _internals = {
  createApplier,
};

function createApplier(opts: ApplyOpts) {
  return new Applier(opts);
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
  const k8s = _internals.createApplier(opts);

  await k8s.execute();
}
