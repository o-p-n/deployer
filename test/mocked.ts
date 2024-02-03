/** */

import { expect, use } from "expecto/index.ts";
import mocked, { mock } from "expecto/mocked.ts";

import { Buffer } from "deno_std/io/buffer.ts";
import { CommandBuilder, CommandResult } from "dax";

use(mocked);

// Stubbing CommandBuilder
export interface CommandBuilderStubberOpts {
  code?: number;
  out?: Uint8Array;
  err?: Uint8Array;
}

export class CommandBuilderStubber {
  #promise?: mock.Spy;
  #command?: mock.Spy;

  constructor() {
    this.#promise = undefined;
    this.#command = undefined;
  }

  get promise() {
    return this.#promise;
  }

  get command() {
    return this.#command;
  }

  apply(opts: CommandBuilderStubberOpts) {
    this.restore();

    const combined = new Buffer();
    if (opts.out) {
      combined.grow(opts.out.byteLength);
      combined.writeSync(opts.out);
    }
    if (opts.err) {
      combined.grow(opts.err.byteLength);
      combined.writeSync(opts.err);
    }

    this.#command = mock.spy(CommandBuilder.prototype, "command");

    const result = new CommandResult(
      opts.code ?? 0,
      new Buffer(opts.out),
      new Buffer(opts.err),
      combined,
    );
    this.#promise = mock.stub(
      CommandBuilder.prototype,
      "then",
      (onfulfilled) => Promise.resolve(result).then(onfulfilled),
    );
  }

  restore() {
    this.#promise && !this.#promise.restored && this.#promise.restore();
    this.#promise = undefined;

    this.#command && !this.#command.restored && this.#command.restore();
    this.#command = undefined;
  }
}

export { expect, mock, use };
