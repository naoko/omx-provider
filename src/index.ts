/**
 * omx-provider - public API
 *
 * Install oh-my-codex prompts, skills, and agents into
 * Claude Code, Cursor, or any supported AI coding tool.
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
