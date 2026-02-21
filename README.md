# Zyklus

Visual node-based editor for creating music patterns, powered by [Strudel](https://strudel.cc).

Inspired by modular synthesizers and live coding — connect nodes to build loops, apply transforms, and add effects, all compiled to Strudel code and played live in the browser.

## Features

- **Pattern nodes** — define patterns using Strudel mini-notation (`bd sd`, `c3 e3 g3`, etc.)
- **Transform nodes** — apply transformations (`fast`, `slow`, `rev`, `stack`)
- **Effect nodes** — add audio effects (`reverb`, `delay`, `gain`)
- **Output node** — compiles the graph and plays audio
- **Live preview** — see the generated Strudel code in real-time

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [React Flow](https://reactflow.dev) — node graph editor
- [Strudel](https://strudel.cc) — music live coding engine
- [Tailwind CSS](https://tailwindcss.com)

## Getting Started

```bash
# Install dependencies
yarn

# Start dev server
yarn dev
```

Open http://localhost:5173 in your browser.

## How It Works

1. Create pattern nodes with Strudel mini-notation
2. Connect them through transform/effect nodes
3. Wire everything to the output node
4. Hit **Play** to hear your creation

The graph is compiled into Strudel code and executed in real-time using Web Audio.

## License

MIT
