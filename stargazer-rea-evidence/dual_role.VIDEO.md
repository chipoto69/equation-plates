---
videomd: 1
name: dual-role
description: 制作方式（推断）：代码/模板渲染 59%、AI 生成视频 41%
source:
  file: dual_role.mp4
  sha256: 4ca7b6cf2eca6c240a85a3404e958d4410d0e183cde233dcbe8b768bb25d688a
  duration: 19.042
  size: 480x854
  fps: 24.0
  aspect: '9:16'
shots: 10
lang: zh
made_mix:
  code_render: 0.5864
  ai_video: 0.4136
confidence: 0.552
readers:
- tools
open_questions: 12
generator:
  name: rea-video
  version: 0.1.0
---

# dual_role.mp4

**结论**（推断）：混合制作：代码/模板渲染 59% + AI 生成视频 41%（其中 31% 时长实拍还是 AI 证据不足，待确认）；叠加层：动态贴纸/GIF、图形贴片、静态贴纸（代码/剪辑软件合成）；声音：人声；剪辑包装：贴纸/动图 11 处
**制作方式**（推断，按时长）：代码/模板渲染 59%、AI 生成视频 41%
**复刻**：AI 视频 5 镜 → 1 个生成单元、1 次 Seedance 2.0（含 Mini / Fast） 调用；代码渲染/录屏 5 镜 → 1 个代码工程（5 段）

## 下一步

- 没开 VLM：能看图就先复核，`rea-video review <本目录>` → 填 `review_answers.json` → `rea-video apply-review <本目录>`
- 复刻：`rea-video remake <本目录>`，能自动做的先做掉，其余原片占位；`remake/status.md` 逐镜写了还要做什么。拿到新镜头写进 `remake/mine.json` 再跑一次
- 代码渲染镜头由 `rea-video code-remake <本目录>` 重画（上一条会自动跑）：改 `code/spec.json` 再跑，不要从零写
- AI 类镜头：提示词在 `video/remake.md` 的「生成单元」；要自动生成跑 `rea-video remake-plan` + `remake-run --dry-run`，会计费，先问用户

## 不确定点

- VLM 没有生效（未开 VLM；实拍/AI/3D 的区分只靠像素统计，可信度有限。能看图的 agent：运行 rea-video review 逐镜看图并 apply-review 并入；否则建议配置 VLM（任意 OpenAI 兼容的多模态模型，如 Gemini / GPT-4o / 豆包 / Qwen-VL）：设置…
- 镜头 #1（0.0–1.4s）：代码/模板渲染 只有 54% 置信，次选 cg_3d
- 镜头 #2（1.4–2.8s）：AI 还是实拍待确认：只有清晰度节奏、没有重复帧（重新压缩也会留下）、没有 AIGC 标识，需要看图确认
- 镜头 #3（2.8–3.9s）：AI 生成视频 只有 57% 置信，次选 avatar
- 镜头 #4（3.9–5.8s）：代码/模板渲染 只有 40% 置信，次选 cg_3d
- 镜头 #5（5.8–7.5s）：AI 还是实拍待确认：只有清晰度节奏、没有重复帧（重新压缩也会留下）、没有 AIGC 标识，需要看图确认
- 镜头 #6（7.5–10.5s）：代码/模板渲染 只有 57% 置信，次选 cg_3d
- 镜头 #7（10.5–11.5s）：AI 生成视频 只有 55% 置信，次选 avatar
- 另有 4 处，见 `video/timeline.md` 里带 `flag` 的行

## 地图

先读本页；要细节时只打开需要的文件。每行是 `路径 | 约 token | 里面有什么 · 什么时候读`，路径相对本目录。

```videomd-map
video/timeline.md | 655 | 时间线：一行一个镜头 · 想知道某段讲什么、哪镜要复核、某镜怎么做
video/content.md | 72 | 内容与结构 · 要讲什么、叙事线、结构时间轴、台词
video/cast.md | 53 | 角色、场景与道具 · 做角色参考图、写首帧提示词
video/sound.md | 292 | 声音 · 人声、BGM、音效、节拍和来源
video/look.md | 439 | 拍法、打光与剪辑 · 有实拍镜头时：景别、机位、布光、器材
video/packaging.md | 630 | 剪辑包装 · 字幕、花字、贴纸、画中画的时间和样式
video/remake.md | 5577 | 复刻方案 · 生成单元、拍摄场次、代码合成、要准备的真实素材、表演与情绪
video/shots/*.md | 394 | 逐镜细节，token 是每个文件的平均值 · 核实某一镜：看得到的、推断和依据、提示词、帧图
breakdown.json | 34966 | 完整原始数据 · 程序读取；模型一般不用打开
shots/ | - | 每镜的联系表和首尾帧 · 看图核实
storyboard.jpg | - | 全片故事板 · 一眼看全片
stems/ | - | 人声、配乐、音效分轨 · 听声音、复刻配音配乐
packaging/ | - | 字幕文件、包装时间轴、贴纸截图 · 复刻字幕和包装
frames/ | - | 画面场景：每场景原尺寸帧、画上去那一层的抠图和采样点、测量值 · 复刻代码渲染画面
audio.png | - | 声音波形和节拍图 · 看节奏
```

## 读法

- 每行一个镜头：`#编号 起-止(秒) | 键 值 | …`。键后带 `~` 的是工具推断，不带的是画面里看得到或直接测得的。
- `story` 在叙事里的作用和讲的点 · `seen` 画面里看到的 · `act` 表演（情绪、强度、表情）· `camera` 运镜 · `overlay` 叠加层 · `made~` 制作方式（推断）· `material~` 素材来源（推断）· `remake` 复刻路线 · `flag` 需要复核
- 某一镜的全部细节在 `video/shots/编号.md`（如 `video/shots/07.md`）。
- 「看到的」可以对着截图核实；「推断」是工具和看图模型的判断，依据写在每镜文件的「判断依据」里，两者对不上时以截图为准。
