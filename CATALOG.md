# AI Coding Skills & Plugins Catalog

A comprehensive catalog of reusable skills and plugins across AI coding tools.
Covers **Anthropic Claude Code Plugins**, **gstack Skills**, and portability guidance for adopting them in Cursor, Codex, and other tools.

---

## How to Read This Catalog

Each entry includes:
- **What it does** — one-liner
- **Components** — what's inside (commands, agents, skills, hooks)
- **Portability** — how easy it is to use outside Claude Code
- **Source** — where to find it

### Portability Ratings

| Rating | Meaning |
|--------|---------|
| **Universal** | Pure markdown prompts. Works anywhere that accepts system instructions. |
| **High** | Mostly markdown. May need minor path/format adjustments. |
| **Medium** | Core logic is portable but references platform-specific concepts. |
| **Low** | Uses platform-specific APIs (hooks, event system). Requires reimplementation. |

---

## Anthropic Claude Code Plugins

Source: [github.com/anthropics/claude-code/tree/main/plugins](https://github.com/anthropics/claude-code/tree/main/plugins)

### Development Workflows

| Plugin | Command | What It Does | Portability |
|--------|---------|-------------|-------------|
| [feature-dev](#feature-dev) | `/feature-dev` | 7-phase structured feature development (discover, explore, clarify, architect, implement, review, summarize) | Universal |
| [commit-commands](#commit-commands) | `/commit`, `/commit-push-pr`, `/clean_gone` | Git workflow automation — auto-commit messages, push+PR, stale branch cleanup | Universal |
| [agent-sdk-dev](#agent-sdk-dev) | `/new-sdk-app` | Scaffold and verify Claude Agent SDK apps (Python/TypeScript) | Universal |

### Code Review

| Plugin | Command | What It Does | Portability |
|--------|---------|-------------|-------------|
| [code-review](#code-review) | `/code-review` | Multi-agent PR review with confidence scoring (threshold 80/100) to filter false positives | Universal |
| [pr-review-toolkit](#pr-review-toolkit) | `/review-pr` | 6 specialized review agents: comments, tests, error handling, types, quality, simplification | Universal |

### Design & Style

| Plugin | Command | What It Does | Portability |
|--------|---------|-------------|-------------|
| [frontend-design](#frontend-design) | (auto-invoked) | Guides bold, production-grade UI — eliminates generic AI aesthetic | Universal |
| [explanatory-output-style](#explanatory-output-style) | (auto) | Educational insights alongside code implementation | Low |
| [learning-output-style](#learning-output-style) | (auto) | Interactive learning — asks user to write key code at decision points | Low |

### Safety & Security

| Plugin | Command | What It Does | Portability |
|--------|---------|-------------|-------------|
| [security-guidance](#security-guidance) | (auto) | Intercepts edits and warns about OWASP patterns (XSS, injection, eval, pickle) | Low |
| [hookify](#hookify) | `/hookify` | Create custom behavior prevention rules via natural language | Low |

### Meta & Migration

| Plugin | Command | What It Does | Portability |
|--------|---------|-------------|-------------|
| [plugin-dev](#plugin-dev) | `/plugin-dev:create-plugin` | Toolkit for building Claude Code plugins (7 skills, 3 agents) | Medium |
| [ralph-wiggum](#ralph-wiggum) | `/ralph-loop` | Autonomous iteration loops — prevents early exit until task is done | Low |
| [claude-opus-4-5-migration](#claude-opus-4-5-migration) | (auto-invoked) | Migrate model strings and prompts from Sonnet 4.x / Opus 4.1 to Opus 4.5 | Universal |

---

### Plugin Details

#### feature-dev
**Portability: Universal** | Author: Sid Bidasaria

7-phase workflow: Discovery → Codebase Exploration → Clarifying Questions → Architecture Design → Implementation → Quality Review → Summary. All components are markdown files.

- **Commands:** `feature-dev.md`
- **Agents:** `code-explorer.md`, `code-architect.md`, `code-reviewer.md`
- **Hooks:** None
- **To port:** Copy markdown files. Rename agents to match target platform's agent/skill format.

#### code-review
**Portability: Universal** | Author: Boris Cherny

Spawns 4 parallel agents for CLAUDE.md compliance, bug detection, and git history analysis. Each finding gets a confidence score; only issues scoring 80+ are reported. Requires `gh` CLI.

- **Commands:** `code-review.md`
- **Agents:** Inline (spawned by command prompt)
- **Hooks:** None
- **To port:** Copy the command markdown. Adjust agent spawning syntax if target doesn't support inline agents.

#### pr-review-toolkit
**Portability: Universal** | Author: Daisy Hollman

6 modular review agents, each focused on one aspect:
1. `comment-analyzer` — comment quality and accuracy
2. `pr-test-analyzer` — test coverage gaps
3. `silent-failure-hunter` — swallowed errors, missing error paths
4. `type-design-analyzer` — type safety and design
5. `code-reviewer` — general code quality
6. `code-simplifier` — unnecessary complexity

- **Commands:** `review-pr.md`
- **Agents:** 6 markdown files with YAML frontmatter
- **Hooks:** None
- **To port:** Copy all markdown files. Each agent is a standalone system prompt.

#### commit-commands
**Portability: Universal** | Author: Anthropic

Three git shortcuts:
- `/commit` — analyze diff, draft message, stage, commit
- `/commit-push-pr` — commit + push + create PR via `gh`
- `/clean_gone` — delete local branches whose remote is gone

- **Commands:** 3 markdown files
- **Hooks:** None
- **To port:** Direct copy. Requires `git` and `gh` CLI.

#### frontend-design
**Portability: Universal** | Authors: Prithvi Rajasekaran, Alexander Bricken

A single SKILL.md that steers the model toward bold typography, intentional color palettes, high-impact animations, and away from generic "AI-generated" aesthetics.

- **Skills:** `frontend-design/SKILL.md`
- **Hooks:** None
- **To port:** Copy SKILL.md into any system prompt or rules file.

#### security-guidance
**Portability: Low**

Python hook (~220 LOC) that intercepts Edit/Write/MultiEdit tool calls and checks for 9 security anti-patterns: GitHub Actions injection, `eval()`, `innerHTML`, `pickle`, `child_process.exec()`, etc. Deduplicates warnings per file per session.

- **Hooks:** PreToolUse (`security_reminder_hook.py`)
- **To port:** Extract the pattern list and rewrite as a rules/guidelines document for the target platform. The detection logic needs reimplementation.

#### hookify
**Portability: Low**

Most complex plugin. Full Python rule engine with config loader, matchers, and handlers across 4 hook events (PreToolUse, PostToolUse, Stop, UserPromptSubmit). Users describe unwanted behaviors in natural language; it generates `.local.md` rule files.

- **Commands:** 4 (`hookify`, `list`, `configure`, `help`)
- **Agents:** `conversation-analyzer.md`
- **Skills:** `writing-rules/`
- **Hooks:** 4 Python scripts
- **To port:** The generated rule files are portable markdown. The engine itself requires full reimplementation per platform.

#### plugin-dev
**Portability: Medium** | Author: Daisy Hollman

Meta-toolkit for building Claude Code plugins. 7 skills covering hooks, MCP, plugin structure, settings, commands, agents, and skill development. Content is Claude Code-specific knowledge, but delivered as markdown.

- **Commands:** `create-plugin.md`
- **Agents:** `agent-creator.md`, `plugin-validator.md`, `skill-reviewer.md`
- **Skills:** 7 directories
- **To port:** Useful as reference material. Would need rewriting to target a different plugin system.

#### ralph-wiggum
**Portability: Low**

Stop hook that prevents Claude from exiting, forcing iterative work until a completion marker is output or max iterations reached.

- **Commands:** `ralph-loop.md`, `cancel-ralph.md`
- **Hooks:** Stop (`stop-hook.sh`)
- **To port:** The concept (iterative loop until done) is universal. Implementation requires platform-specific exit interception.

#### agent-sdk-dev
**Portability: Universal** | Author: Ashwin Bhat

Scaffolds Claude Agent SDK projects. Command asks setup questions, generates boilerplate, installs SDK, then runs a verifier agent to check for common mistakes.

- **Commands:** `new-sdk-app.md`
- **Agents:** `agent-sdk-verifier-py.md`, `agent-sdk-verifier-ts.md`
- **To port:** Direct copy. Content is Anthropic SDK-specific but format is portable.

#### claude-opus-4-5-migration
**Portability: Universal** | Author: William Hu

Single SKILL.md with instructions for updating model strings, beta headers, and configuration when migrating to Opus 4.5.

- **Skills:** `claude-opus-4-5-migration/SKILL.md`
- **To port:** Copy directly. Only relevant for Anthropic model users.

#### explanatory-output-style
**Portability: Low**

SessionStart hook that injects educational output instructions. The prompt content is portable; the delivery mechanism (shell script hook) is Claude Code-specific.

- **Hooks:** SessionStart (`session-start.sh`)
- **To port:** Extract the prompt and add it to your system instructions / rules file.

#### learning-output-style
**Portability: Low**

SessionStart hook that makes the AI pause at decision points and ask the user to write 5-10 lines of code themselves.

- **Hooks:** SessionStart (`session-start.sh`)
- **To port:** Same as explanatory — extract prompt, add to system instructions.

---

## gstack Skills

Source: [github.com/garrytan/gstack](https://github.com/garrytan/gstack) | Author: Garry Tan | License: MIT

gstack is already multi-platform via its setup script (`./setup --host <platform>`).

**Supported platforms:** Claude Code, OpenAI Codex, Gemini CLI, Cursor, Kiro CLI, Factory Droid

### Planning & Strategy (5 skills)

| Skill | Command | What It Does | Portability |
|-------|---------|-------------|-------------|
| Office Hours | `/office-hours` | YC-style product advisory: 6 forcing questions on demand reality, status quo, desperate specificity, narrowest wedge, observation, future-fit | Universal |
| CEO Review | `/plan-ceo-review` | Founder-mode plan review with 4 modes: Scope Expansion, Selective Expansion, Hold, Reduction | Universal |
| Eng Review | `/plan-eng-review` | Architecture lock-down: data flow diagrams, edge cases, test coverage, performance planning | Universal |
| Design Review (Plan) | `/plan-design-review` | Rates each design dimension 0-10, explains what a 10 looks like, then fixes the plan | Universal |
| Auto Plan | `/autoplan` | Runs CEO + design + eng review sequentially with auto-decisions; only surfaces taste calls | Universal |

### Design (4 skills)

| Skill | Command | What It Does | Portability |
|-------|---------|-------------|-------------|
| Design Consultation | `/design-consultation` | Full design system creation: aesthetic, typography, color, layout, spacing, motion. Outputs DESIGN.md | Universal |
| Design Shotgun | `/design-shotgun` | Generates multiple visual variants for side-by-side comparison | High |
| Design HTML | `/design-html` | Production-ready responsive HTML using Pretext patterns | Universal |
| Design Review (Live) | `/design-review` | Audits live site for visual inconsistency, AI slop, spacing issues; fixes with atomic commits | High |

### Development & Review (5 skills)

| Skill | Command | What It Does | Portability |
|-------|---------|-------------|-------------|
| Review | `/review` | Pre-landing PR review: SQL safety, LLM trust boundaries, conditional side effects | Universal |
| Investigate | `/investigate` | Systematic debugging: investigate → analyze → hypothesize → implement. No fixes without root cause | Universal |
| Ship | `/ship` | Sync main, run tests, audit coverage, push, open PR. Bootstraps test framework if missing | Universal |
| Land & Deploy | `/land-and-deploy` | Merge PR, wait for CI/deploy, verify production health | High |
| Codex | `/codex` | Cross-model second opinion from OpenAI Codex: review (pass/fail), challenge (adversarial), consult | High |

### QA & Testing (5 skills)

| Skill | Command | What It Does | Deps |
|-------|---------|-------------|------|
| QA | `/qa` | Real browser testing, find bugs, fix with atomic commits, generate regression tests | browse daemon, Bun, Playwright |
| QA Only | `/qa-only` | Bug reporting without code changes; structured report with health score and repro steps | browse daemon, Bun, Playwright |
| Benchmark | `/benchmark` | Baseline page load, Core Web Vitals, resource sizes; compare before/after per PR | browse daemon |
| Canary | `/canary` | Post-deploy monitoring: console errors, performance regressions, page failures | browse daemon |
| CSO | `/cso` | Chief Security Officer: OWASP Top 10 + STRIDE threat modeling, 8/10+ confidence gate | Universal |

### Documentation & Reflection (2 skills)

| Skill | Command | What It Does | Portability |
|-------|---------|-------------|-------------|
| Document Release | `/document-release` | Updates README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md to match shipped changes | Universal |
| Retro | `/retro` | Weekly engineering retrospective with per-person breakdowns and trend tracking | Universal |

### Browser & Utilities (4+ skills)

| Skill | Command | What It Does | Deps |
|-------|---------|-------------|------|
| Browse | `/browse` | Headless Chromium: navigate, interact, screenshot, assert (~100ms/cmd) | Bun, Playwright, Chromium |
| Setup Cookies | `/setup-browser-cookies` | Import cookies from Chrome/Arc/Brave/Edge into headless session | Real browser installed |
| Connect Chrome | `/connect-chrome` | Headed Chrome with Side Panel for live observation | Chrome browser |
| Setup Deploy | `/setup-deploy` | One-time deploy config: detects Fly.io/Render/Vercel/Netlify/Heroku/GH Actions | None |

### Safety Power Tools (4 skills)

| Skill | Command | What It Does | Portability |
|-------|---------|-------------|-------------|
| Careful | `/careful` | Warns before destructive commands (rm -rf, DROP TABLE, force-push, kubectl delete) | Universal |
| Freeze | `/freeze` | Restricts file edits to a specific directory for the session | Universal |
| Guard | `/guard` | Combines `/careful` + `/freeze` for maximum safety | Universal |
| Unfreeze | `/unfreeze` | Removes the freeze boundary | Universal |

---

## Portability Summary

### By the Numbers

**Anthropic Plugins (13 total):**
- Universal (just copy): 7 — feature-dev, code-review, pr-review-toolkit, commit-commands, frontend-design, agent-sdk-dev, claude-opus-4-5-migration
- Medium: 1 — plugin-dev
- Low (needs reimplementation): 5 — security-guidance, hookify, ralph-wiggum, explanatory-output-style, learning-output-style

**gstack Skills (31 total):**
- Universal / High: ~27 (already ships with multi-platform setup)
- Requires browse daemon: 6 (qa, qa-only, benchmark, canary, design-review, design-shotgun)

### What's Portable and What's Not

**Trivially portable** (markdown prompts — copy and adjust paths):
- All gstack planning/strategy skills
- All gstack safety power tools
- Anthropic's feature-dev, code-review, pr-review-toolkit, commit-commands, frontend-design
- Any SKILL.md or command markdown file

**Portable with transformation** (extract prompt from wrapper):
- Anthropic's output-style plugins → extract prompt, add to system instructions
- Anthropic's security-guidance → extract pattern list, convert to guidelines doc
- hookify-generated rules → the `.local.md` rule files are portable even though the engine isn't

**Platform-specific** (requires reimplementation):
- Hook-based plugins (security-guidance engine, hookify engine, ralph-wiggum loop)
- Browse daemon features (gstack's /qa, /benchmark, /canary need Playwright + Bun)

---

## Installing & Porting Guide

### gstack (already multi-platform)

```bash
# Clone
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack

# Install for your platform
cd ~/.claude/skills/gstack
./setup                    # Claude Code (default)
./setup --host codex       # OpenAI Codex
./setup --host cursor      # Cursor (auto-detected)
./setup --host kiro        # Kiro CLI
./setup --host factory     # Factory Droid
./setup --host auto        # Auto-detect all installed tools
```

### Anthropic Plugins → Claude Code

```bash
# Clone the plugins repo
git clone https://github.com/anthropics/claude-code.git /tmp/claude-code

# Copy a plugin to your Claude Code config
cp -r /tmp/claude-code/plugins/feature-dev ~/.claude/plugins/feature-dev

# Or reference in settings.json
# Add to ~/.claude/settings.json: { "plugins": ["~/.claude/plugins/feature-dev"] }
```

### Porting Anthropic Plugins → Cursor / Other Tools

For **Universal** plugins (pure markdown):

1. Copy the command `.md` file(s)
2. Copy any agent `.md` files
3. Place them in:
   - **Cursor:** `.cursor/rules/` or `.cursorrules`
   - **Codex:** `~/.codex/skills/<name>/SKILL.md`
   - **Windsurf:** `.windsurfrules`
4. Adjust any Claude Code-specific references (tool names, agent spawning syntax)

For **Low portability** plugins (hooks-based):

1. Extract the core prompt/rules content from the Python/shell scripts
2. Convert to a guidelines document or rules file
3. Platform-specific hook behavior (blocking edits, intercepting exit) cannot be ported without native support

### Transformation Checklist

When porting a plugin to a new platform:

- [ ] Copy all `.md` files (commands, agents, skills)
- [ ] Remove Claude Code-specific frontmatter if not supported
- [ ] Replace `agents/` references with platform equivalent (or inline the agent prompts)
- [ ] Replace tool names (`Edit`, `Write`, `Bash`) with platform equivalents if needed
- [ ] Convert `hooks.json` event handlers to platform-native equivalents (if they exist)
- [ ] Test that slash commands / skill triggers work in the target tool
- [ ] Document any features lost in translation (hooks, parallel agents, etc.)

---

## Contributing

To add a skill or plugin to this catalog:

1. Add an entry to the appropriate section above
2. Include: name, command, one-liner description, portability rating, source link
3. Add a details section if the plugin has multiple components
4. Note any dependencies or special requirements
