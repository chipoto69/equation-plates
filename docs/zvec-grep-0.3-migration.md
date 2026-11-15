# zvec-grep 0.3.0 migration (Stargazer re-trial 2026-11-15)

Mac currently pins **0.2.2**. v0.3.0 is a Rust rewrite (npm `@zvec/zvec-grep@0.3.0`).

## Breaking CLI
- Search is now positional: `zg "query"` (not a subcommand).
- Management uses flags: `zg --index`, `zg --status`, `zg --server on`, `zg --install`.
- Index example: `zg --index --embedding local/potion-retrieval-32m`
- Help: `zg --help search`, `zg --help models`.

## Box evidence
Indexed 4 markdown files (company-brain + goals) in 4.0s; query "which Vercel project serves canonical init" top-hit COMPANY-MAP.md lines 9–18 naming `init-contextpulse`.

## Suggested Mac bump
```bash
npm install -g @zvec/zvec-grep@0.3.0
# approve postinstall if npm prompts; then re-index wiki/brain corpora
zg --index --embedding local/potion-retrieval-32m
```
Keep qmd for exact-keyword fleet search.
