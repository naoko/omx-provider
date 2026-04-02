/**
 * omx-provider - public API
 *
 * Install oh-my-codex prompts, skills, and agents into
 * Claude Code, Cursor, Codex, or any supported AI coding tool.
 *
 * Also transforms Anthropic Claude Code plugins for other platforms.
 */

export {
  PROVIDER_NAMES,
  type ProviderName,
  type Provider,
  getProvider,
  isProviderName,
} from "./providers.js";

export { install, type InstallOptions, type InstallResult } from "./installer.js";

export {
  resolveOmxRoot,
  listOmxPrompts,
  listOmxSkills,
  listOmxAgents,
} from "./resolver.js";

export {
  readPlugin,
  readPluginDirectory,
  parseFrontmatter,
  type ParsedPlugin,
  type PluginManifest,
  type PluginCommand,
  type PluginAgent,
  type PluginSkill,
  type PluginHook,
  type PortabilityLevel,
} from "./plugin-reader.js";

export {
  transformPlugin,
  analyzeTransform,
  formatAnalysis,
  type TransformOptions,
  type TransformResult,
  type TransformAnalysis,
  type PluginAnalysis,
  type FileAction,
} from "./plugin-transformer.js";
