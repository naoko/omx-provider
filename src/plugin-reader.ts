/**
 * Reads and parses Anthropic Claude Code plugin directories
 * into a normalized in-memory representation.
 */

import { existsSync } from "fs";
import { readFile, readdir } from "fs/promises";
import { join, basename } from "path";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: { name: string; email?: string };
}

export interface PluginCommand {
  name: string;
  description?: string;
  argumentHint?: string;
  allowedTools?: string;
  body: string;
}

export interface PluginAgent {
  name: string;
  description?: string;
  tools?: string;
  model?: string;
  color?: string;
  body: string;
}

export interface PluginSkill {
  name: string;
  description?: string;
  body: string;
}

export interface PluginHook {
  event: string;
  scriptPath: string;
  description?: string;
}

export type PortabilityLevel = "universal" | "high" | "medium" | "low";

export interface ParsedPlugin {
  manifest: PluginManifest;
  commands: PluginCommand[];
  agents: PluginAgent[];
  skills: PluginSkill[];
  hooks: PluginHook[];
  portability: PortabilityLevel;
  warnings: string[];
  sourcePath: string;
}

/* ------------------------------------------------------------------ */
/*  Frontmatter parser                                                 */
/* ------------------------------------------------------------------ */

export function parseFrontmatter(
  content: string,
): { attrs: Record<string, string>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { attrs: {}, body: content };
  }

  const rawYaml = match[1];
  const body = match[2];
  const attrs: Record<string, string> = {};

  for (const line of rawYaml.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) attrs[key] = value;
  }

  return { attrs, body };
}

/* ------------------------------------------------------------------ */
/*  Plugin reader                                                      */
/* ------------------------------------------------------------------ */

async function readMarkdownFiles(
  dir: string,
): Promise<Array<{ name: string; attrs: Record<string, string>; body: string }>> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  const results: Array<{ name: string; attrs: Record<string, string>; body: string }> = [];

  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    const content = await readFile(join(dir, entry), "utf-8");
    const { attrs, body } = parseFrontmatter(content);
    results.push({ name: entry.replace(/\.md$/, ""), attrs, body });
  }
  return results;
}

/**
 * Read a single Anthropic plugin directory.
 */
export async function readPlugin(pluginPath: string): Promise<ParsedPlugin> {
  const manifestPath = join(pluginPath, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `Not a valid plugin: missing .claude-plugin/plugin.json in ${pluginPath}`,
    );
  }

  const manifest: PluginManifest = JSON.parse(
    await readFile(manifestPath, "utf-8"),
  );

  // Read commands
  const rawCommands = await readMarkdownFiles(join(pluginPath, "commands"));
  const commands: PluginCommand[] = rawCommands.map((c) => ({
    name: c.name,
    description: c.attrs.description,
    argumentHint: c.attrs["argument-hint"],
    allowedTools: c.attrs["allowed-tools"],
    body: c.body,
  }));

  // Read agents
  const rawAgents = await readMarkdownFiles(join(pluginPath, "agents"));
  const agents: PluginAgent[] = rawAgents.map((a) => ({
    name: a.attrs.name || a.name,
    description: a.attrs.description,
    tools: a.attrs.tools,
    model: a.attrs.model,
    color: a.attrs.color,
    body: a.body,
  }));

  // Read skills
  const skills: PluginSkill[] = [];
  const skillsDir = join(pluginPath, "skills");
  if (existsSync(skillsDir)) {
    const skillEntries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of skillEntries) {
      if (!entry.isDirectory()) continue;
      const skillMd = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMd)) continue;
      const content = await readFile(skillMd, "utf-8");
      const { attrs, body } = parseFrontmatter(content);
      skills.push({
        name: attrs.name || entry.name,
        description: attrs.description,
        body,
      });
    }
  }

  // Detect hooks
  const hooks: PluginHook[] = [];
  const warnings: string[] = [];

  const hooksJsonPath = join(pluginPath, ".claude-plugin", "hooks.json");
  if (existsSync(hooksJsonPath)) {
    try {
      const hooksConfig = JSON.parse(await readFile(hooksJsonPath, "utf-8"));
      const hooksObj = hooksConfig.hooks || {};
      for (const event of Object.keys(hooksObj)) {
        const eventHooks = hooksObj[event];
        if (!Array.isArray(eventHooks)) continue;
        for (const entry of eventHooks) {
          const hookDefs = entry.hooks || [];
          for (const h of hookDefs) {
            if (h.command) {
              hooks.push({
                event,
                scriptPath: h.command,
                description: hooksConfig.description,
              });
            }
          }
        }
      }
    } catch {
      warnings.push("Failed to parse hooks.json");
    }
  }

  const portability = assessPortability({ hooks, commands, agents, skills });

  if (hooks.length > 0) {
    warnings.push(
      `Plugin uses ${hooks.length} hook(s) (${hooks.map((h) => h.event).join(", ")}). ` +
        `Hook-based features cannot be actively enforced in the target platform.`,
    );
  }

  return {
    manifest,
    commands,
    agents,
    skills,
    hooks,
    portability,
    warnings,
    sourcePath: pluginPath,
  };
}

/**
 * Discover and read multiple plugins from a parent directory.
 */
export async function readPluginDirectory(
  parentPath: string,
): Promise<ParsedPlugin[]> {
  const entries = await readdir(parentPath, { withFileTypes: true });
  const plugins: ParsedPlugin[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pluginPath = join(parentPath, entry.name);
    if (existsSync(join(pluginPath, ".claude-plugin", "plugin.json"))) {
      plugins.push(await readPlugin(pluginPath));
    }
  }

  return plugins;
}

/* ------------------------------------------------------------------ */
/*  Portability assessment                                             */
/* ------------------------------------------------------------------ */

function assessPortability(plugin: {
  hooks: PluginHook[];
  commands: PluginCommand[];
  agents: PluginAgent[];
  skills: PluginSkill[];
}): PortabilityLevel {
  if (plugin.hooks.length > 0) return "low";

  // Check if any content references Claude Code-specific internals
  const allBodies = [
    ...plugin.commands.map((c) => c.body),
    ...plugin.agents.map((a) => a.body),
    ...plugin.skills.map((s) => s.body),
  ].join("\n");

  const claudeSpecificPatterns = [
    "hooks.json",
    "PreToolUse",
    "PostToolUse",
    "SessionStart",
    "${CLAUDE_PLUGIN_ROOT}",
    ".claude-plugin",
  ];

  const matches = claudeSpecificPatterns.filter((p) => allBodies.includes(p));
  if (matches.length >= 3) return "medium";

  return "universal";
}
