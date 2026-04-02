import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { homedir } from "os";
import { join } from "path";
import {
  PROVIDER_NAMES,
  getProvider,
  isProviderName,
} from "./providers.js";

describe("PROVIDER_NAMES", () => {
  it("includes claude, cursor, and codex", () => {
    assert.deepStrictEqual([...PROVIDER_NAMES], ["claude", "cursor", "codex"]);
  });
});

describe("isProviderName", () => {
  it("returns true for valid providers", () => {
    assert.ok(isProviderName("claude"));
    assert.ok(isProviderName("cursor"));
    assert.ok(isProviderName("codex"));
  });

  it("returns false for invalid providers", () => {
    assert.ok(!isProviderName("vscode"));
    assert.ok(!isProviderName(""));
  });
});

describe("getProvider", () => {
  it("returns claude config with correct paths", () => {
    const claude = getProvider("claude");
    assert.equal(claude.displayName, "Claude Code");
    assert.equal(claude.cliCommand, "claude");
    assert.equal(claude.homeDir, join(homedir(), ".claude"));
    assert.equal(claude.configFile, "settings.json");
    assert.equal(claude.configFormat, "json");
    assert.equal(claude.projectDirName, ".claude");
  });

  it("claude uses CLAUDE.md for prompt injection", () => {
    const claude = getProvider("claude");
    assert.equal(claude.promptInjection.type, "markdown-file");
    assert.equal(
      (claude.promptInjection as { filename: string }).filename,
      "CLAUDE.md",
    );
  });

  it("returns cursor config with correct paths", () => {
    const cursor = getProvider("cursor");
    assert.equal(cursor.displayName, "Cursor");
    assert.equal(cursor.cliCommand, null);
    assert.equal(cursor.homeDir, join(homedir(), ".cursor"));
    assert.equal(cursor.configFile, "settings.json");
    assert.equal(cursor.projectDirName, ".cursor");
  });

  it("cursor uses .cursorrules for prompt injection", () => {
    const cursor = getProvider("cursor");
    assert.equal(cursor.promptInjection.type, "rules-file");
    assert.equal(
      (cursor.promptInjection as { filename: string }).filename,
      ".cursorrules",
    );
  });

  it("returns codex config with correct paths", () => {
    const codex = getProvider("codex");
    assert.equal(codex.displayName, "OpenAI Codex");
    assert.equal(codex.cliCommand, "codex");
    assert.equal(codex.homeDir, join(homedir(), ".codex"));
    assert.equal(codex.configFile, "config.json");
    assert.equal(codex.configFormat, "json");
    assert.equal(codex.projectDirName, ".codex");
  });

  it("codex uses AGENTS.md for prompt injection", () => {
    const codex = getProvider("codex");
    assert.equal(codex.promptInjection.type, "markdown-file");
    assert.equal(
      (codex.promptInjection as { filename: string }).filename,
      "AGENTS.md",
    );
  });
});
