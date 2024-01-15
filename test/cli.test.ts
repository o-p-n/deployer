/** */

import { afterEach, beforeEach, describe, it } from "deno_std/testing/bdd.ts";
import { expect, mock } from "./mocked.ts";

import { _internals, global } from "../src/cli.ts";

describe("cli", () => {
  // deno-lint-ignore no-explicit-any
  let cli: any;
  let stubConsoleLog: mock.Spy;
  let stubConsoleError: mock.Spy;
  let spyGetEnv: mock.Spy;

  beforeEach(() => {
    stubConsoleError = mock.stub(console, "error");
    stubConsoleLog = mock.stub(console, "log");
    spyGetEnv = mock.spy(_internals, "getEnv");

    cli = global()
      .noExit()
      .throwErrors();
  });

  afterEach(() => {
    stubConsoleError.restore();
    stubConsoleLog.restore();
    spyGetEnv.restore();
  });

  it("returns on --help", async () => {
    const stubShowHelp = mock.stub(cli, "showHelp");
    const result = await cli.parse(["--help"]);

    expect(result).to.exist();
    expect(stubShowHelp).to.have.been.called(1);
    expect(spyGetEnv).to.have.been.deep.calledWith([
      "DEPLOYER_IDENTITY_DIR",
    ]);
  });
});
