/** */

import { Command } from "cliffy/command/mod.ts";
import { z } from "zod";

export const _internals = {
  getEnv(key: string, def?: string): string | undefined {
    return Deno.env.get(key) || def;
  },
};

export const GlobalSchema = z.object({
  env: z.string(),
  identityDir: z.string(),
});

export type GlobalConfig = z.infer<typeof GlobalSchema>;

export type GlobalCommand = Command<void, void, GlobalConfig>;

export function global(): GlobalCommand {
  return new Command()
    .name("deployer")
    .description("Tool for deploying resources to outer-planes.net")
    .option(
      "-e, --env <env:string>",
      "the environment to operate on",
      {
        required: true,
      },
    )
    .option(
      "-I, --identity-dir <identities:file>",
      "directory containing identities (public/private keys)",
      {
        default: _internals.getEnv("DEPLOYER_IDENTITY_DIR") || Deno.cwd(),
      },
    );
}
