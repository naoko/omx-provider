import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  parseFrontmatter,
  readPlugin,
  readPluginDirectory,
} from "./plugin-reader.js";

/* ------------------------------------------------------------------ */
/*  parseFrontmatter                                                   */
/* ------------------------------------------------------------------ */

describe("parseFrontmatter", () => {
  it("parses YAML frontmatter and body", () => {
    const input = `---
description: My command
argument-hint: <name>
---

# Command body

Do the thing.`;

    const { attrs, body } = parseFrontmatter(input);
    assert.equal(attrs.description, "My command");
    assert.equal(attrs["argument-hint"], "<name>");
    assert.ok(body.includes("# Command body"));
    assert.ok(body.includes("Do the thing."));
  });

  it("handles content with no frontmatter", () => {
    const input = "# Just a heading\n\nSome text.";
    const { attrs, body } = parseFrontmatter(input);
    assert.deepStrictEqual(attrs, {});
    assert.equal(body, input);
  });

  it("strips surrounding quotes from values", () => {
    const input = `---
name: "my-plugin"
label: 'quoted'
---

body`;

    const { attrs } = parseFrontmatter(input);
    assert.equal(attrs.name, "my-plugin");
    assert.equal(attrs.label, "quoted");
  });

  it("handles multiword values", () => {
    const input = `---
description: This is a long description with spaces
tools: Glob, Grep, Read, Bash
---

body`;

    const { attrs } = parseFrontmatter(input);
    assert.equal(attrs.description, "This is a long description with spaces");
    assert.equal(attrs.tools, "Glob, Grep, Read, Bash");
  });
});

/* ------------------------------------------------------------------ */
/*  readPlugin                                                         */
/* ------------------------------------------------------------------ */

describe("readPlugin", () => {
  let tempDir: string;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), "plugin-reader-"));

    // Create a fake plugin
    const pluginDir = join(tempDir, "test-plugin");
    mkdirSync(join(pluginDir, ".claude-plugin"), { recursive: true });
    mkdirSync(join(pluginDir, "commands"), { recursive: true });
    mkdirSync(join(pluginDir, "agents"), { recursive: true });
    mkdirSync(join(pluginDir, "skills", "my-skill"), { recursive: true });

    writeFileSync(
      join(pluginDir, ".claude-plugin", "plugin.json"),
      JSON.stringify({
        name: "test-plugin",
        version: "1.0.0",
        description: "A test plugin",
        author: { name: "Test Author" },
      }),
    );

    writeFileSync(
      join(pluginDir, "commands", "do-thing.md"),
      `---
description: Does a thing
argument-hint: <arg>
allowed-tools: Bash(pattern:*), Read
---

# Do Thing

Step 1: Do the thing.
Step 2: Verify it worked.
`,
    );

    writeFileSync(
      join(pluginDir, "agents", "reviewer.md"),
      `---
name: code-reviewer
description: Reviews code for bugs
tools: Glob, Grep, Read
model: sonnet
color: green
---

# Code Reviewer

You are a code reviewer. Find bugs.
`,
    );

    writeFileSync(
      join(pluginDir, "skills", "my-skill", "SKILL.md"),
      `---
name: my-skill
description: A reusable skill
---

# My Skill

Guidelines for doing things well.
`,
    );
  });

  after(() => {
    rmSync(tempDir, { recursive: true });
  });

  it("reads manifest correctly", async () => {
    const plugin = await readPlugin(join(tempDir, "test-plugin"));
    assert.equal(plugin.manifest.name, "test-plugin");
    assert.equal(plugin.manifest.version, "1.0.0");
    assert.equal(plugin.manifest.description, "A test plugin");
  });

  it("reads commands with frontmatter", async () => {
    const plugin = await readPlugin(join(tempDir, "test-plugin"));
    assert.equal(plugin.commands.length, 1);
    assert.equal(plugin.commands[0].name, "do-thing");
    assert.equal(plugin.commands[0].description, "Does a thing");
    assert.equal(plugin.commands[0].argumentHint, "<arg>");
    assert.ok(plugin.commands[0].body.includes("Step 1"));
  });

  it("reads agents with frontmatter", async () => {
    const plugin = await readPlugin(join(tempDir, "test-plugin"));
    assert.equal(plugin.agents.length, 1);
    assert.equal(plugin.agents[0].name, "code-reviewer");
    assert.equal(plugin.agents[0].model, "sonnet");
    assert.equal(plugin.agents[0].color, "green");
    assert.ok(plugin.agents[0].body.includes("Find bugs"));
  });

  it("reads skills", async () => {
    const plugin = await readPlugin(join(tempDir, "test-plugin"));
    assert.equal(plugin.skills.length, 1);
    assert.equal(plugin.skills[0].name, "my-skill");
    assert.ok(plugin.skills[0].body.includes("Guidelines"));
  });

  it("assesses universal portability when no hooks", async () => {
    const plugin = await readPlugin(join(tempDir, "test-plugin"));
    assert.equal(plugin.portability, "universal");
    assert.equal(plugin.hooks.length, 0);
  });

  it("throws on invalid plugin directory", async () => {
    await assert.rejects(
      () => readPlugin(join(tempDir, "nonexistent")),
      /Not a valid plugin/,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  readPlugin with hooks (low portability)                            */
/* ------------------------------------------------------------------ */

describe("readPlugin with hooks", () => {
  let tempDir: string;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), "plugin-hooks-"));

    const pluginDir = join(tempDir, "hook-plugin");
    mkdirSync(join(pluginDir, ".claude-plugin"), { recursive: true });
    mkdirSync(join(pluginDir, "hooks"), { recursive: true });

    writeFileSync(
      join(pluginDir, ".claude-plugin", "plugin.json"),
      JSON.stringify({
        name: "hook-plugin",
        version: "1.0.0",
        description: "Plugin with hooks",
      }),
    );

    writeFileSync(
      join(pluginDir, ".claude-plugin", "hooks.json"),
      JSON.stringify({
        description: "Security checks",
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: "command",
                  command: "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/check.py",
                },
              ],
              matcher: "Edit|Write",
            },
          ],
        },
      }),
    );

    writeFileSync(
      join(pluginDir, "hooks", "check.py"),
      '"""Security check hook."""\nimport sys\nsys.exit(0)\n',
    );
  });

  after(() => {
    rmSync(tempDir, { recursive: true });
  });

  it("detects hooks and marks low portability", async () => {
    const plugin = await readPlugin(join(tempDir, "hook-plugin"));
    assert.equal(plugin.portability, "low");
    assert.equal(plugin.hooks.length, 1);
    assert.equal(plugin.hooks[0].event, "PreToolUse");
  });

  it("adds warning about hooks", async () => {
    const plugin = await readPlugin(join(tempDir, "hook-plugin"));
    assert.ok(plugin.warnings.some((w) => w.includes("hook")));
  });
});

/* ------------------------------------------------------------------ */
/*  readPluginDirectory (batch)                                        */
/* ------------------------------------------------------------------ */

describe("readPluginDirectory", () => {
  let tempDir: string;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), "plugin-batch-"));

    // Create two plugins
    for (const name of ["alpha", "beta"]) {
      const dir = join(tempDir, name);
      mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
      writeFileSync(
        join(dir, ".claude-plugin", "plugin.json"),
        JSON.stringify({ name, version: "1.0.0", description: `Plugin ${name}` }),
      );
    }

    // Create a non-plugin directory
    mkdirSync(join(tempDir, "not-a-plugin"));
    writeFileSync(join(tempDir, "not-a-plugin", "README.md"), "hello");
  });

  after(() => {
    rmSync(tempDir, { recursive: true });
  });

  it("discovers all valid plugins", async () => {
    const plugins = await readPluginDirectory(tempDir);
    assert.equal(plugins.length, 2);
    const names = plugins.map((p) => p.manifest.name).sort();
    assert.deepStrictEqual(names, ["alpha", "beta"]);
  });

  it("skips non-plugin directories", async () => {
    const plugins = await readPluginDirectory(tempDir);
    assert.ok(!plugins.some((p) => p.manifest.name === "not-a-plugin"));
  });
});
