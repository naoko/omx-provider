import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  listOmxPrompts,
  listOmxSkills,
  listOmxAgents,
} from "./resolver.js";

describe("listOmxPrompts", () => {
  let fakeOmxRoot: string;

  before(() => {
    fakeOmxRoot = mkdtempSync(join(tmpdir(), "omx-test-"));
    const promptsDir = join(fakeOmxRoot, "prompts");
    mkdirSync(promptsDir);
    writeFileSync(join(promptsDir, "architect.md"), "# Architect");
    writeFileSync(join(promptsDir, "executor.md"), "# Executor");
    writeFileSync(join(promptsDir, "notes.txt"), "not a prompt");
  });

  after(() => {
    rmSync(fakeOmxRoot, { recursive: true });
  });

  it("returns only .md files from prompts directory", async () => {
    const prompts = await listOmxPrompts(fakeOmxRoot);
    assert.equal(prompts.length, 2);
    assert.ok(prompts.some((p) => p.endsWith("architect.md")));
    assert.ok(prompts.some((p) => p.endsWith("executor.md")));
    assert.ok(!prompts.some((p) => p.endsWith("notes.txt")));
  });

  it("returns empty array when prompts directory does not exist", async () => {
    const prompts = await listOmxPrompts("/nonexistent/path");
    assert.deepStrictEqual(prompts, []);
  });
});

describe("listOmxSkills", () => {
  let fakeOmxRoot: string;

  before(() => {
    fakeOmxRoot = mkdtempSync(join(tmpdir(), "omx-test-"));
    const skillsDir = join(fakeOmxRoot, "skills");
    mkdirSync(skillsDir);

    // Valid skill with SKILL.md
    mkdirSync(join(skillsDir, "code-review"));
    writeFileSync(join(skillsDir, "code-review", "SKILL.md"), "---\nname: code-review\n---");

    // Valid skill with SKILL.md
    mkdirSync(join(skillsDir, "autopilot"));
    writeFileSync(join(skillsDir, "autopilot", "SKILL.md"), "---\nname: autopilot\n---");

    // Directory without SKILL.md — should be excluded
    mkdirSync(join(skillsDir, "incomplete"));

    // File, not directory — should be excluded
    writeFileSync(join(skillsDir, "README.md"), "readme");
  });

  after(() => {
    rmSync(fakeOmxRoot, { recursive: true });
  });

  it("returns only directories with SKILL.md", async () => {
    const skills = await listOmxSkills(fakeOmxRoot);
    assert.equal(skills.length, 2);
    const names = skills.map((s) => s.name).sort();
    assert.deepStrictEqual(names, ["autopilot", "code-review"]);
  });

  it("returns empty array when skills directory does not exist", async () => {
    const skills = await listOmxSkills("/nonexistent/path");
    assert.deepStrictEqual(skills, []);
  });
});

describe("listOmxAgents", () => {
  let fakeOmxRoot: string;

  before(() => {
    fakeOmxRoot = mkdtempSync(join(tmpdir(), "omx-test-"));
    const promptsDir = join(fakeOmxRoot, "prompts");
    mkdirSync(promptsDir);
    writeFileSync(join(promptsDir, "debugger.md"), "# Debugger");
    writeFileSync(join(promptsDir, "planner.md"), "# Planner");
  });

  after(() => {
    rmSync(fakeOmxRoot, { recursive: true });
  });

  it("returns agents with name (without .md extension) and path", async () => {
    const agents = await listOmxAgents(fakeOmxRoot);
    assert.equal(agents.length, 2);
    const debugger_ = agents.find((a) => a.name === "debugger");
    assert.ok(debugger_);
    assert.ok(debugger_.path.endsWith("debugger.md"));
  });

  it("returns empty array when prompts directory does not exist", async () => {
    const agents = await listOmxAgents("/nonexistent/path");
    assert.deepStrictEqual(agents, []);
  });
});
