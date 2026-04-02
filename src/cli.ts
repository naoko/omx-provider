#!/usr/bin/env node

/**
 * omx-provider CLI
 *
 * Installs oh-my-codex prompts, skills, and agents into Claude Code,
 * Cursor, or other supported AI coding tools.
 */

import { PROVIDER_NAMES, isProviderName, getProvider } from "./providers.js";
import { install } from "./installer.js";
import { resolveOmxRoot } from "./resolver.js";

const HELP = `
omx-provider - Install oh-my-codex into any AI coding tool

Usage:
  omx-provider setup --provider <name>   Install OMX assets for a provider
  omx-provider status                    Show installed providers
  omx-provider help                      Show this help message

Providers:
  claude   Claude Code (~/.claude/)
  cursor   Cursor (~/.cursor/)

Options:
  --provider <name>   Target provider (required for setup)
  --project           Install to project-local directory instead of user home
  --verbose           Show detailed output
  --dry-run           Show what would happen without doing it

Environment:
  OMX_PROVIDER        Default provider (overridden by --provider flag)

Examples:
  omx-provider setup --provider claude
  omx-provider setup --provider cursor --project
  OMX_PROVIDER=claude omx-provider setup
`;

function parseArgs(args: string[]): {
  command: string;
  provider?: string;
  projectLocal: boolean;
  verbose: boolean;
  dryRun: boolean;
} {
  let command = "help";
  let provider: string | undefined;
  let projectLocal = false;
  let verbose = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "setup" || arg === "status" || arg === "help") {
      command = arg;
      continue;
    }

    if (arg === "--provider" || arg === "-p") {
      provider = args[++i];
      continue;
    }
    if (arg.startsWith("--provider=")) {
      provider = arg.slice("--provider=".length);
      continue;
    }

    if (arg === "--project") {
      projectLocal = true;
      continue;
    }
    if (arg === "--verbose") {
      verbose = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      command = "help";
      continue;
    }
  }

  // Fall back to env var
  if (!provider && process.env.OMX_PROVIDER) {
    provider = process.env.OMX_PROVIDER;
  }

  return { command, provider, projectLocal, verbose, dryRun };
}

async function statusCommand(): Promise<void> {
  console.log("omx-provider status\n");

  let omxRoot: string;
  try {
    omxRoot = resolveOmxRoot();
    console.log(`oh-my-codex found: ${omxRoot}`);
  } catch {
    console.log("oh-my-codex: NOT FOUND");
    console.log("  Install with: npm install -g oh-my-codex");
    return;
  }

  console.log("\nProvider directories:");
  for (const name of PROVIDER_NAMES) {
    const p = getProvider(name);
    const { existsSync } = await import("fs");
    const exists = existsSync(p.homeDir);
    const marker = exists ? "installed" : "not found";
    console.log(`  ${name.padEnd(8)} ${p.homeDir} (${marker})`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  switch (parsed.command) {
    case "help":
      console.log(HELP);
      return;

    case "status":
      await statusCommand();
      return;

    case "setup": {
      if (!parsed.provider) {
        console.error(
          "Error: --provider is required for setup.\n" +
            `Available providers: ${PROVIDER_NAMES.join(", ")}`
        );
        process.exit(1);
      }

      if (!isProviderName(parsed.provider)) {
        console.error(
          `Error: unknown provider "${parsed.provider}".\n` +
            `Available providers: ${PROVIDER_NAMES.join(", ")}`
        );
        process.exit(1);
      }

      const provider = getProvider(parsed.provider);
      console.log(`omx-provider setup`);
      console.log(`==================\n`);
      console.log(`Provider: ${provider.displayName} (${parsed.provider})`);
      console.log(`Target:   ${parsed.projectLocal ? "project-local" : "user"}\n`);

      try {
        const result = await install({
          provider: parsed.provider,
          projectLocal: parsed.projectLocal,
          verbose: parsed.verbose,
          dryRun: parsed.dryRun,
        });

        console.log(`\nDone!`);
        console.log(`  Prompts: ${result.prompts.installed} installed, ${result.prompts.skipped} unchanged`);
        console.log(`  Skills:  ${result.skills.installed} installed, ${result.skills.skipped} unchanged`);
        console.log(`  Prompt injection: ${result.promptInjection.status}`);
        if (result.promptInjection.file) {
          console.log(`    -> ${result.promptInjection.file}`);
        }
      } catch (err) {
        console.error(`\nSetup failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
      return;
    }

    default:
      console.error(`Unknown command: ${parsed.command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
