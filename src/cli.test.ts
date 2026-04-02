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

  // Transform command tests
  it("parses transform command with --source and --target", () => {
    const result = parseArgs(["transform", "--source", "./plugins/feature-dev", "--target", "cursor"]);
    assert.equal(result.command, "transform");
    assert.equal(result.source, "./plugins/feature-dev");
    assert.equal(result.target, "cursor");
  });

  it("parses --source= syntax", () => {
    const result = parseArgs(["transform", "--source=./plugins", "--target=codex"]);
    assert.equal(result.source, "./plugins");
    assert.equal(result.target, "codex");
  });

  it("parses -s and -t shorthands", () => {
    const result = parseArgs(["transform", "-s", "./plugins", "-t", "cursor"]);
    assert.equal(result.source, "./plugins");
    assert.equal(result.target, "cursor");
  });

  it("parses --output flag for transform", () => {
    const result = parseArgs(["transform", "--source", ".", "--target", "cursor", "--output", "/tmp/out"]);
    assert.equal(result.output, "/tmp/out");
  });

  it("parses --output= syntax", () => {
    const result = parseArgs(["transform", "--source", ".", "--target", "cursor", "--output=/tmp/out"]);
    assert.equal(result.output, "/tmp/out");
  });

  it("parses -o shorthand for output", () => {
    const result = parseArgs(["transform", "-s", ".", "-t", "cursor", "-o", "/tmp/out"]);
    assert.equal(result.output, "/tmp/out");
  });

  it("transform with --verbose and --dry-run", () => {
    const result = parseArgs(["transform", "-s", ".", "-t", "codex", "--verbose", "--dry-run"]);
    assert.equal(result.command, "transform");
    assert.ok(result.verbose);
    assert.ok(result.dryRun);
  });

  it("parses --yes flag", () => {
    const result = parseArgs(["transform", "-s", ".", "-t", "cursor", "--yes"]);
    assert.ok(result.yes);
  });

  it("parses -y shorthand", () => {
    const result = parseArgs(["transform", "-s", ".", "-t", "cursor", "-y"]);
    assert.ok(result.yes);
  });

  it("yes defaults to false", () => {
    const result = parseArgs(["transform", "-s", ".", "-t", "cursor"]);
    assert.equal(result.yes, false);
  });
});
