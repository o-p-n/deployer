/** */

import { describe, it } from "deno_std/testing/bdd.ts";

import { createCommand } from "../src/main.ts";
import { expect } from "./mocked.ts";

describe("main", () => {
  it("creates the command", () => {
    const result = createCommand();

    expect(result).to.exist();
  });
});
