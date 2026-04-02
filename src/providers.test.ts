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
  it("includes claude and cursor", () => {
    assert.deepStrictEqual([...PROVIDER_NAMES], ["claude", "cursor"]);
  });

  it("does not include codex (handled natively by OMX)", () => {
    assert.ok(!PROVIDER_NAMES.includes("codex" as any));
  });
});

describe("isProviderName", () => {
  it("returns true for valid providers", () => {
    assert.ok(isProviderName("claude"));
    assert.ok(isProviderName("cursor"));
  });

  it("returns false for invalid providers", () => {
    assert.ok(!isProviderName("codex"));
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
});
