# Frontier Studio

Live preview companion for Frontier OS apps. Run alongside Claude Code to see a real-time dashboard and preview of your app as it's being built.

## Usage

From your Frontier OS app directory:

```bash
npx frontier-studio
```

This opens a browser with:
- **Project dashboard** — phases, status, SDK modules, next action
- **Live preview** — your app rendering in real-time via Vite HMR

## How It Works

Frontier Studio watches your `.frontier-app/` state files for changes and displays them in a visual dashboard. It auto-starts your app's Vite dev server and embeds the preview in an iframe. No AI integration — Claude Code handles all the AI work in your terminal.

```
Terminal                          Browser (localhost:4983)
┌────────────────────────┐       ┌──────────┬──────────────┐
│ $ claude               │       │ Dashboard│  Live        │
│ > /fos:new-app "..."   │  ──►  │ Phase 2  │  Preview     │
│ > /fos:execute 2       │       │ Modules  │  (iframe)    │
│   ✓ Task 1 done        │       │ Status   │              │
└────────────────────────┘       └──────────┴──────────────┘
```

## Options

```
frontier-studio [path] [--port <port>]

  path          Path to app directory (default: current directory)
  --port <n>    Studio port (default: 4983)
  -h, --help    Show help
```

## Development

```bash
cd studio
npm install
npm run build        # Build server + client
npm run dev          # Run server with tsx (dev mode)
```

## License

MIT
