/** */

import { Command, HelpCommand } from "cliffy/command/mod.ts";
import { z } from "zod";

export const _internals = {
  getEnv(key: string, def?: string): string | undefined {
    return Deno.env.get(key) || def;
  },
};

export type GlobalOpts = {
  env: string,
  identityDir: string,
};

// TODO: figure out how to get rid of any ...
export function globalCommand(): Command<GlobalOpts> {
  const cmd = new Command()
    .name("deployer")
    .description("Tool for deploying resources to outer-planes.net")
    .globalOption(
      "-e, --env <env:string>",
      "the environment to operate on",
      {
        required: true,
      },
    )
    .globalOption(
      "-I, --identity-dir <identities:file>",
      "directory containing identities (public/private keys)",
      {
        default: _internals.getEnv("DEPLOYER_IDENTITY_DIR") || Deno.cwd(),
      },
    )
    .command("help", new HelpCommand().noGlobals()).reset()
    .default("help")
    .reset();

    // this funny biz is intentional to keep type safety everywhere else
    return (cmd as unknown) as Command<GlobalOpts>;
}
