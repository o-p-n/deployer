/** */

import { Command, HelpCommand } from "cliffy/command/mod.ts";
import pkg from "../../package.json" with { type: "json" };

export type GlobalOpts = {
  env: string;
  identityDir: string;
};

export function globalCommand(): Command<GlobalOpts> {
  const cmd = new Command()
    .name(pkg.name)
    .version(pkg.version)
    .description("Tool for deploying resources to outer-planes.net")
    .globalEnv(
      "DEPLOYER_IDENTITY_DIR=<identities:file>",
      "set directory containing identities",
      { prefix: "DEPLOYER_" },
    )
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
        default: Deno.cwd(),
      },
    )
    .command("help", new HelpCommand().noGlobals()).reset()
    .default("help")
    .reset();

  // this funny biz is intentional to keep type safety everywhere else
  return (cmd as unknown) as Command<GlobalOpts>;
}
