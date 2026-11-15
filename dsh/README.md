# PaperLocus for DeepSeek Harness (dsh)

Reference-aware whole-paper reading, literature positioning and reusable Markdown
research notes for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness),
packaged as an opt-in **skill-only bundle**.

PaperLocus classifies a paper by *narrative logic* — a computer-science conference /
arXiv method paper vs. a Nature–Science-family evidence-chain paper — places it in the
literature, separates `paper claim` / `evidence` / `inference` / `open question`, and
turns it into a note you can retrieve later.

## What the bundle contributes

One Skill named `paperlocus` in the session skill catalog, with its `references/`
bundle. Nothing else: no service, no model tool, no UI, no theme, no network access.

It does that by inserting a **second, isolated `@deepseek-ai/dsh-skill-filesystem`
provider** whose only root is the `skills/` directory shipped inside this package.
Default project/user skill roots are untouched (`includeDefaultRoots: false`), so the
row cannot shadow or reorder existing skills. The Skill root is resolved from the
installed npm identity anchored at the DSH profile, so registry installs, `link:`
checkouts, git installs and packed tarballs all work the same way.

## Requirements

- DeepSeek Harness `0.1.5-rc.1` or newer.
- A profile that already mounts the skill registry and model-facing skill tooling
  (`@deepseek-ai/dsh-skill` + `@deepseek-ai/dsh-tool-skill`) — every profile built on
  `@deepseek-ai/dsh-base` does.

## Install

From a registry:

```bash
dsh plugin --profile web add dsh-paperlocus
```

From this checkout:

```bash
dsh plugin --profile web add ./dsh
```

From a packed tarball:

```bash
dsh plugin --profile web add ./dsh-paperlocus-0.2.0.tgz
```

Then restart the profile (`dsh --profile web`). Remove it with:

```bash
dsh plugin --profile web remove dsh-paperlocus
```

## Verify

```bash
dsh --profile web --dump-config | grep -A4 paperlocus-skill-filesystem
```

In a session the skill appears in the catalog as `paperlocus`; ask "read this paper and
tell me where it sits in the literature" and the model loads it.

## Test

The suite checks both halves of the bundle: that the Skill root resolves from the
installed profile, and that the isolated provider discovers and loads `paperlocus` from
it. The provider module belongs to the DSH installation, so point the test at it:

```bash
PROFILE=web
DSH_SKILL_FILESYSTEM_PATH=$(node -e "console.log(require('node:module').createRequire('$DSH_HOME/profiles/$PROFILE/package.json').resolve('@deepseek-ai/dsh-skill-filesystem'))") \
DSH_PROFILE_BASE_URL=$DSH_HOME/profiles/$PROFILE/package.json \
npm test
```

## Layout

```
dsh/
├── package.json              # declares dsh.bundle.patch
├── cordis.patch.yml          # the layer: one isolated skill-filesystem row
├── lib/index.js              # resolvePaperlocusSkillRoot() + package constants
├── skills/paperlocus/
│   ├── SKILL.md              # the dsh-adapted skill
│   └── references/paper_type_examples.md
├── test/skill-discovery.test.mjs
└── LICENSE
```

## Derivation from the Codex skill

Kept verbatim from `paperlocus/SKILL.md` (v0.2.0): working mode, context construction
strategy, input acquisition and input-specific handling, the paper-type classification
checklist, both workflows, the anti-hallucination rules, and the output template.

Changed for DeepSeek Harness:

| Change | Why |
| --- | --- |
| Frontmatter gained `whenToUse` | dsh catalogs it and uses it for skill selection. |
| New "Tooling In DeepSeek Harness" section | Maps the abstract input-handling rules onto `read` / `glob` / `grep` / `web_fetch` / `web_search` / `write` so the workflow is executable here. |
| Reference to the public README rewritten | The upstream line pointed at the Codex repository root; this package ships its own README. |

Dropped: `agents/openai.yaml` (Codex UI metadata with no dsh equivalent) and the Codex
`$paperlocus` invocation syntax (dsh selects skills from their catalog description).

## License

MIT. PaperLocus is Copyright (c) 2026 littleZ05; see [LICENSE](./LICENSE) for the full
notice. This integration is part of the PaperLocus repository and carries the same
license.
