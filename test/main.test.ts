/** */

import { describe, it } from "deno_std/testing/bdd.ts";

import { createCommand } from "../src/main.ts";
import { expect } from "./mocked.ts";

describe("main", () => {
  it("creates the command", () => {
    const result = createCommand();

    let opt;
    opt = result.getOption("env");
    expect(opt).to.exist();

    opt = result.getOption("identity-dir");
    expect(opt).to.exist();

    let cmd;
    cmd = result.getCommand("encrypt");
    expect(cmd).to.exist();

    cmd = result.getCommand("decrypt");
    expect(cmd).to.exist();
  });
});
