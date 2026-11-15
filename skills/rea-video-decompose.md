# Skill: rea-video decompose (Stargazer trial 2026-11-15)

Use when an agent needs to reverse-engineer a short film, trailer, or reference clip into remakeable shot structure for equation-plates / artur-hops / fframes work.

## Install (box/Mac, no secrets required for pixel path)
```bash
uv venv .venv && uv pip install -e "git+https://github.com/JuneYaooo/rea-video.git#egg=rea-video[dev]"
# optional: uv pip install 'rea-video[ocr]' 'rea-video[asr]'
```
Needs `ffmpeg` on PATH. Without VLM keys the CLI still emits VIDEO.md + report.html from pixel/audio forensics (lower confidence).

## Run
```bash
rea-video probe path/to/clip.mp4
rea-video decompose path/to/clip.mp4 -o out/ref
# optional agent VLM pass:
# rea-video review out/ref  → fill review_answers.json → rea-video apply-review out/ref
```

## Outputs to keep
- `out/ref/VIDEO.md` — agent-readable layered breakdown (videomd format)
- `out/ref/report.html` / `report.md` — human report
- `out/ref/breakdown.json` — machine source of truth

## Proven on box (2026-11-15)
`docs/cases/videos/dual_role.mp4` (19s, 10 shots) → VIDEO.md in 47s, verdict mixed code_render+ai_video, confidence 0.55 without VLM.
