import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./cli.js";

describe("parseArgs", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    delete process.env.OMX_PROVIDER;
    Object.assign(process.env, originalEnv);
  });

  it("defaults to help command with no args", () => {
    const result = parseArgs([]);
    assert.equal(result.command, "help");
    assert.equal(result.provider, undefined);
    assert.equal(result.projectLocal, false);
    assert.equal(result.verbose, false);
    assert.equal(result.dryRun, false);
  });

  it("parses setup command", () => {
    const result = parseArgs(["setup", "--provider", "claude"]);
    assert.equal(result.command, "setup");
    assert.equal(result.provider, "claude");
  });

  it("parses --provider= syntax", () => {
    const result = parseArgs(["setup", "--provider=cursor"]);
    assert.equal(result.command, "setup");
    assert.equal(result.provider, "cursor");
  });

  it("parses -p shorthand", () => {
    const result = parseArgs(["setup", "-p", "claude"]);
    assert.equal(result.command, "setup");
    assert.equal(result.provider, "claude");
  });

  it("parses status command", () => {
    const result = parseArgs(["status"]);
    assert.equal(result.command, "status");
  });

  it("parses --project flag", () => {
    const result = parseArgs(["setup", "--provider", "claude", "--project"]);
    assert.ok(result.projectLocal);
  });

  it("parses --verbose flag", () => {
    const result = parseArgs(["setup", "--provider", "claude", "--verbose"]);
    assert.ok(result.verbose);
  });

  it("parses --dry-run flag", () => {
    const result = parseArgs(["setup", "--provider", "claude", "--dry-run"]);
    assert.ok(result.dryRun);
  });

  it("parses all flags together", () => {
    const result = parseArgs([
      "setup",
      "--provider",
      "cursor",
      "--project",
      "--verbose",
      "--dry-run",
    ]);
    assert.equal(result.command, "setup");
    assert.equal(result.provider, "cursor");
    assert.ok(result.projectLocal);
    assert.ok(result.verbose);
    assert.ok(result.dryRun);
  });

  it("--help overrides command to help", () => {
    const result = parseArgs(["setup", "--help"]);
    assert.equal(result.command, "help");
  });

  it("-h overrides command to help", () => {
    const result = parseArgs(["setup", "-h"]);
    assert.equal(result.command, "help");
  });

  it("falls back to OMX_PROVIDER env var when no --provider flag", () => {
    process.env.OMX_PROVIDER = "cursor";
    const result = parseArgs(["setup"]);
    assert.equal(result.provider, "cursor");
  });

  it("--provider flag takes precedence over OMX_PROVIDER env var", () => {
    process.env.OMX_PROVIDER = "cursor";
    const result = parseArgs(["setup", "--provider", "claude"]);
    assert.equal(result.provider, "claude");
  });
});
