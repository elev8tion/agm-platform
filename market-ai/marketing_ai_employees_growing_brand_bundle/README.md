# OpenAI Agents — Marketing AI Employees (Starter)

This starter mirrors the Claude Code "AI employees" layout, rebuilt for **OpenAI Agents** + your OpenAI API key.

## Folder map
- `agents/` — specialist agents (SEO writer, Email marketer) and an orchestrator ("CMO").
- `tools/` — function tools the agents can call (stubs for GA, GSC, DataForSEO, internal linking, CMS).
- `context/` — put brand voice, guidelines, and examples here **and** upload to an OpenAI Vector Store for File Search.
- `app.py` — CLI for slash‑style commands (e.g. `/research`, `/write`, `/create-email`).

## Quick start
1. `pip install -r requirements.txt`
2. Set env vars in `.env` (copy from `.env.example`)
3. Create an OpenAI **Vector Store** in the UI and upload your context files. Put the `VECTOR_STORE_ID` in `.env`.
4. Run: `python app.py /write "Topic: how to grow a podcast on YouTube"`

> Note: This skeleton uses the **Agents SDK** with the **Responses API**.

## Budget & polish bundle
This bundle adds:
- `config/budget.json` + runtime counters in `budget.py` that cap Web/File Search and total cost.
- A polish pass in `helpers/polish.py` that escalates to `gpt-4o` for final publication quality.
- Updated agent instructions and reusable prompts under `prompts/`.
