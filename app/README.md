# UI Design Workspace

This folder contains design materials and a runnable RoboPetCare prototype for a pet health management app.

## Contents

| Path | Description |
|---|---|
| `stitch_robopet_health_manager/` | Main RoboPetCare web app prototype and Node.js server |
| `design.md` | Product and interface design notes |
| `robo_pet_care_style_color_spec.md` | Visual style and color specification |
| `pet_activity_video.mp4` | Sample pet activity video |
| `pet_cat_eating.mp4` | Sample feeding/eating video |
| `cloudflared.exe` | Cloudflare Tunnel executable |
| `cloudflared.log` | Cloudflare Tunnel log output |

## RoboPetCare App

The main app lives in `stitch_robopet_health_manager/`. It is an Express-based web app with static HTML screens and AI-assisted pet care features, including:

- Pet video analysis
- AI chat for pet health questions
- Feeding advice
- Dashboard, onboarding, alerts, behavior logs, settings, and community forum screens

## Requirements

- Node.js 20+
- npm
- Optional: an AI API key for video analysis, chat, and feeding advice

## Setup

```bash
cd stitch_robopet_health_manager
npm install
```

Create a `.env` file in `stitch_robopet_health_manager/` if you want AI features:

```env
DASHSCOPE_API_KEY=your_dashscope_api_key
PORT=8001
```

You can also use `QWEN_API_KEY` or `OPENAI_API_KEY` instead.

## Run

```bash
npm start
```

Then open:

```text
http://localhost:8001/app.html
```

Health check:

```text
http://localhost:8001/api/health
```

## Useful Commands

```bash
npm run dev
npm test
```

`npm test` currently checks the Node.js server syntax with `node --check server.js`.

## More Documentation

See `stitch_robopet_health_manager/SETUP_GUIDE.md` for the detailed setup guide, environment variables, Docker usage, and API endpoint list.
