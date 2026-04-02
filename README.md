# omx-provider

Install [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) prompts, skills, and agents into any supported AI coding tool.

## Supported providers

| Provider | Home dir | Prompt injection | CLI |
| --- | --- | --- | --- |
| `codex` | `~/.codex/` | `config.toml` key | `codex` |
| `claude` | `~/.claude/` | `CLAUDE.md` | `claude` |
| `cursor` | `~/.cursor/` | `.cursorrules` | Cursor IDE |

## Quick start

```bash
npm install -g oh-my-codex omx-provider

# Install OMX into Claude Code
omx-provider setup --provider claude

# Install OMX into Cursor
omx-provider setup --provider cursor

# Project-local install
omx-provider setup --provider claude --project
```

## What it does

`omx-provider setup` reads the prompts, skills, and agent definitions from your installed `oh-my-codex` package and copies them into the target provider's directory structure:

- **Prompts** go to `~/.claude/prompts/` (or `~/.cursor/prompts/`)
- **Skills** go to `~/.claude/skills/` (or `~/.cursor/skills/`)
- **Agent instructions** are combined into a `CLAUDE.md` or `.cursorrules` file

It does not modify `oh-my-codex` itself. When OMX updates, run setup again to sync.

## Usage

```
omx-provider setup --provider <name>   Install OMX assets for a provider
omx-provider status                    Show installed providers
omx-provider help                      Show help
```

### Options

```
--provider <name>   Target provider: codex, claude, cursor
--project           Install to project directory instead of user home
--verbose           Show detailed output
--dry-run           Show what would happen without doing it
```

### Environment variable

```bash
export OMX_PROVIDER=claude
omx-provider setup   # uses claude
```

## Programmatic API

```typescript
import { install } from "omx-provider";

const result = await install({
  provider: "claude",
  verbose: true,
});

console.log(result.prompts.installed); // number of prompts installed
```

## How it works

```
oh-my-codex (upstream)
  prompts/*.md ──────────> ~/.claude/prompts/
  skills/*/SKILL.md ─────> ~/.claude/skills/
  prompts/*.md ──(merge)─> CLAUDE.md or .cursorrules
```

The wrapper reads from OMX's installed package, so updates to `oh-my-codex` are picked up automatically on the next `omx-provider setup`.

## License

MIT
