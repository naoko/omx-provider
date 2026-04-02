#!/usr/bin/env node

/**
 * omx-provider CLI
 *
 * Installs oh-my-codex prompts, skills, and agents into Claude Code,
 * Cursor, or other supported AI coding tools.
 *
 * Also transforms Anthropic Claude Code plugins for use in other tools.
 */

import { existsSync } from "fs";
import { PROVIDER_NAMES, isProviderName, getProvider } from "./providers.js";
import { install } from "./installer.js";
import { resolveOmxRoot } from "./resolver.js";
import { readPlugin, readPluginDirectory } from "./plugin-reader.js";
import { transformPlugin, analyzeTransform, formatAnalysis } from "./plugin-transformer.js";
import { createInterface } from "readline";

const HELP = `
omx-provider - Install oh-my-codex into any AI coding tool

Usage:
  omx-provider setup --provider <name>   Install OMX assets for a provider
  omx-provider transform --source <path> --target <provider>
                                         Transform Anthropic plugins for a target tool
  omx-provider status                    Show installed providers
  omx-provider help                      Show this help message

Providers:
  claude   Claude Code (~/.claude/)
  cursor   Cursor (~/.cursor/)
  codex    OpenAI Codex (~/.codex/)

Setup Options:
  --provider <name>   Target provider (required for setup)
  --project           Install to project-local directory instead of user home
  --verbose           Show detailed output
  --dry-run           Show what would happen without doing it

Transform Options:
  --source <path>     Path to a plugin directory or parent of multiple plugins
  --target <name>     Target provider to transform for (cursor, codex, claude)
  --output <path>     Output directory (defaults to current directory)
  --yes, -y           Skip confirmation prompt
  --verbose           Show detailed output
  --dry-run           Show what would happen without doing it

Environment:
  OMX_PROVIDER        Default provider (overridden by --provider flag)

Examples:
  omx-provider setup --provider claude
  omx-provider setup --provider cursor --project
  omx-provider transform --source ./plugins/feature-dev --target cursor
  omx-provider transform --source ./plugins --target codex --verbose
  OMX_PROVIDER=claude omx-provider setup
`;

export function parseArgs(args: string[]): {
  command: string;
  provider?: string;
  projectLocal: boolean;
  verbose: boolean;
  dryRun: boolean;
  yes: boolean;
  source?: string;
  target?: string;
  output?: string;
} {
  let command = "help";
  let provider: string | undefined;
  let projectLocal = false;
  let verbose = false;
  let dryRun = false;
  let yes = false;
  let source: string | undefined;
  let target: string | undefined;
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "setup" || arg === "status" || arg === "help" || arg === "transform") {
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

    if (arg === "--source" || arg === "-s") {
      source = args[++i];
      continue;
    }
    if (arg.startsWith("--source=")) {
      source = arg.slice("--source=".length);
      continue;
    }

    if (arg === "--target" || arg === "-t") {
      target = args[++i];
      continue;
    }
    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length);
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      output = args[++i];
      continue;
    }
    if (arg.startsWith("--output=")) {
      output = arg.slice("--output=".length);
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
    if (arg === "--yes" || arg === "-y") {
      yes = true;
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

  return { command, provider, projectLocal, verbose, dryRun, yes, source, target, output };
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
    const exists = existsSync(p.homeDir);
    const marker = exists ? "installed" : "not found";
    console.log(`  ${name.padEnd(8)} ${p.homeDir} (${marker})`);
  }
}

async function promptConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes");
    });
  });
}

async function transformCommand(parsed: ReturnType<typeof parseArgs>): Promise<void> {
  if (!parsed.source) {
    console.error(
      "Error: --source is required for transform.\n" +
        "Specify a path to an Anthropic plugin directory.",
    );
    process.exit(1);
  }

  const targetName = parsed.target || parsed.provider;
  if (!targetName) {
    console.error(
      "Error: --target is required for transform.\n" +
        `Available targets: ${PROVIDER_NAMES.join(", ")}`,
    );
    process.exit(1);
  }

  if (!isProviderName(targetName)) {
    console.error(
      `Error: unknown target "${targetName}".\n` +
        `Available targets: ${PROVIDER_NAMES.join(", ")}`,
    );
    process.exit(1);
  }

  if (!existsSync(parsed.source)) {
    console.error(`Error: source path does not exist: ${parsed.source}`);
    process.exit(1);
  }

  console.log("omx-provider transform");
  console.log("======================\n");

  try {
    // Detect single plugin vs directory of plugins
    let plugins;
    const pluginJsonPath = `${parsed.source}/.claude-plugin/plugin.json`;
    if (existsSync(pluginJsonPath)) {
      plugins = [await readPlugin(parsed.source)];
    } else {
      plugins = await readPluginDirectory(parsed.source);
      if (plugins.length === 0) {
        console.error("No valid plugins found in source directory.");
        console.error("Expected directories with .claude-plugin/plugin.json");
        process.exit(1);
      }
    }

    // --- Analysis phase ---
    const outputDir = parsed.output || process.cwd();
    const analysis = analyzeTransform(plugins, targetName, outputDir);
    console.log(formatAnalysis(analysis));

    // Nothing to do?
    if (analysis.summary.create === 0 && analysis.summary.update === 0) {
      console.log("Nothing to do — all plugins would be skipped.");
      return;
    }

    // Dry-run stops here
    if (parsed.dryRun) {
      console.log("Dry run — no files were written.");
      return;
    }

    // --- Confirmation ---
    if (!parsed.yes) {
      const proceed = await promptConfirm("Proceed with transform? [y/N] ");
      if (!proceed) {
        console.log("Aborted.");
        return;
      }
      console.log("");
    }

    // --- Execute ---
    let totalFiles = 0;
    for (const plugin of plugins) {
      const result = await transformPlugin(plugin, {
        target: targetName,
        outputDir,
        verbose: parsed.verbose,
      });

      const status = result.filesWritten.length > 0
        ? `${result.filesWritten.length} file(s) written`
        : "skipped";
      console.log(
        `  ${result.pluginName.padEnd(30)} [${result.portability}] ${status}`,
      );

      if (parsed.verbose && result.warnings.length > 0) {
        for (const w of result.warnings) {
          console.log(`    warning: ${w}`);
        }
      }

      totalFiles += result.filesWritten.length;
    }

    console.log(`\nDone! ${totalFiles} file(s) written.`);
  } catch (err) {
    console.error(`\nTransform failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
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
            `Available providers: ${PROVIDER_NAMES.join(", ")}`,
        );
        process.exit(1);
      }

      if (!isProviderName(parsed.provider)) {
        console.error(
          `Error: unknown provider "${parsed.provider}".\n` +
            `Available providers: ${PROVIDER_NAMES.join(", ")}`,
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

    case "transform":
      await transformCommand(parsed);
      return;

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
