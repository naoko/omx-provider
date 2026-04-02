/**
 * Provider definitions for AI coding tools.
 *
 * Each provider describes where its config lives, how prompts are
 * injected, and what format configs use.
 */

import { homedir } from "os";
import { join } from "path";

export const PROVIDER_NAMES = ["claude", "cursor", "codex"] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];

export type PromptInjection =
  | { type: "markdown-file"; filename: string }
  | { type: "rules-file"; filename: string };

export interface Provider {
  /** Human-readable name */
  displayName: string;

  /** CLI command (null for IDE-only tools like Cursor) */
  cliCommand: string | null;

  /** User-level home directory */
  homeDir: string;

  /** Config file relative to homeDir */
  configFile: string;

  /** Config format */
  configFormat: "toml" | "json";

  /** Project-level directory name (e.g. .codex, .claude, .cursor) */
  projectDirName: string;

  /** How OMX prompts/instructions get injected */
  promptInjection: PromptInjection;

  /** Where skills are installed relative to homeDir */
  skillsDir: string;

  /** Where prompts are installed relative to homeDir */
  promptsDir: string;
}

const PROVIDERS: Record<ProviderName, Provider> = {
  claude: {
    displayName: "Claude Code",
    cliCommand: "claude",
    homeDir: join(homedir(), ".claude"),
    configFile: "settings.json",
    configFormat: "json",
    projectDirName: ".claude",
    promptInjection: { type: "markdown-file", filename: "CLAUDE.md" },
    skillsDir: "skills",
    promptsDir: "prompts",
  },

  cursor: {
    displayName: "Cursor",
    cliCommand: null,
    homeDir: join(homedir(), ".cursor"),
    configFile: "settings.json",
    configFormat: "json",
    projectDirName: ".cursor",
    promptInjection: { type: "rules-file", filename: ".cursorrules" },
    skillsDir: "skills",
    promptsDir: "prompts",
  },

  codex: {
    displayName: "OpenAI Codex",
    cliCommand: "codex",
    homeDir: join(homedir(), ".codex"),
    configFile: "config.json",
    configFormat: "json",
    projectDirName: ".codex",
    promptInjection: { type: "markdown-file", filename: "AGENTS.md" },
    skillsDir: "skills",
    promptsDir: "prompts",
  },
};

export function getProvider(name: ProviderName): Provider {
  return PROVIDERS[name];
}

export function isProviderName(value: string): value is ProviderName {
  return PROVIDER_NAMES.includes(value as ProviderName);
}
