/**
 * Resolves paths to oh-my-codex's installed package assets
 * (prompts, skills, agents, templates).
 */

import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/** Locate the oh-my-codex package root. */
export function resolveOmxRoot(): string {
  // Try resolving via require.resolve
  try {
    const omxEntry = require.resolve("oh-my-codex");
    // Walk up to find package.json
    let dir = dirname(omxEntry);
    for (let i = 0; i < 5; i++) {
      if (existsSync(join(dir, "package.json"))) {
        const pkg = require(join(dir, "package.json"));
        if (pkg.name === "oh-my-codex") return dir;
      }
      dir = dirname(dir);
    }
  } catch {
    // fall through
  }

  // Fallback: check common global install locations
  const candidates = [
    join(dirname(process.execPath), "..", "lib", "node_modules", "oh-my-codex"),
    join(process.env.HOME || "", "node_modules", "oh-my-codex"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find oh-my-codex package. Install it with: npm install -g oh-my-codex"
  );
}

/** List all prompt markdown files from OMX. */
export async function listOmxPrompts(omxRoot: string): Promise<string[]> {
  const promptsDir = join(omxRoot, "prompts");
  if (!existsSync(promptsDir)) return [];
  const entries = await readdir(promptsDir);
  return entries
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(promptsDir, f));
}

/** List all skill directories from OMX. */
export async function listOmxSkills(
  omxRoot: string,
): Promise<Array<{ name: string; path: string }>> {
  const skillsDir = join(omxRoot, "skills");
  if (!existsSync(skillsDir)) return [];
  const entries = await readdir(skillsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && existsSync(join(skillsDir, e.name, "SKILL.md")))
    .map((e) => ({ name: e.name, path: join(skillsDir, e.name) }));
}

/** List all agent prompt files from OMX. */
export async function listOmxAgents(
  omxRoot: string,
): Promise<Array<{ name: string; path: string }>> {
  const promptsDir = join(omxRoot, "prompts");
  if (!existsSync(promptsDir)) return [];
  const entries = await readdir(promptsDir);
  return entries
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ name: f.replace(/\.md$/, ""), path: join(promptsDir, f) }));
}
