import os, sys, asyncio
from dotenv import load_dotenv
from agents import Runner, set_default_openai_api, set_default_openai_key, set_tracing_disabled
from agents import set_default_openai_model
from agents.cmo_agent import cmo_agent
from agents.seo_writer import seo_writer
from agents.email_marketer import email_marketer
from helpers.polish import polish_text

load_dotenv()

# Configure Agents SDK
api = os.getenv("OPENAI_API", "responses")
set_default_openai_api(api)
if os.getenv("OPENAI_API_KEY"):
    set_default_openai_key(os.getenv("OPENAI_API_KEY"))

# Default model (kept lightweight)
set_default_openai_model(os.getenv("DEFAULT_MODEL", "gpt-4o-mini"))

# Optional: disable tracing by default
set_tracing_disabled(True)

AGENTS = {
    "cmo": cmo_agent,
    "seo": seo_writer,
    "email": email_marketer,
}

HELP = """Commands:
  /research <topic>       Research & outline using SEO Writer
  /write <brief>          Draft long-form, SEO-optimized article (auto-polish with gpt-4o)
  /optimize <url>         Analyze & optimize existing content (on-page/links/metadata)
  /review                 Review past performance & opportunities
  /create-email <brief>   Create a single email
  /create-series <brief>  Multi-email sequence
  /help                   Show this
"""

async def dispatch(command: str, arg: str):
    if command == "/help":
        print(HELP); return

    if command == "/research":
        prompt = f"Slash:/research\nUser: {arg}"
        result = await Runner.run(AGENTS["seo"], prompt, max_turns=8)
        print(result.final_output); return

    if command == "/write":
        prompt = f"Slash:/write\nUser: {arg}"
        result = await Runner.run(AGENTS["seo"], prompt, max_turns=12)
        draft = result.final_output or ""
        polished = polish_text(draft, model=os.getenv("POLISH_MODEL", "gpt-4o"))
        print(polished); return

    if command == "/optimize":
        prompt = f"Slash:/optimize\nTargetURL: {arg}"
        result = await Runner.run(AGENTS["seo"], prompt, max_turns=10)
        print(result.final_output); return

    if command == "/review":
        prompt = "Slash:/review"
        result = await Runner.run(AGENTS["seo"], prompt, max_turns=8)
        print(result.final_output); return

    if command == "/create-email":
        prompt = f"Slash:/create-email\nBrief: {arg}"
        result = await Runner.run(AGENTS["email"], prompt, max_turns=8)
        print(result.final_output); return

    if command == "/create-series":
        prompt = f"Slash:/create-series\nBrief: {arg}"
        result = await Runner.run(AGENTS["email"], prompt, max_turns=12)
        print(result.final_output); return

    print("Unknown command. \n" + HELP)

def main():
    if len(sys.argv) < 2:
        print(HELP); return
    command = sys.argv[1]
    arg = " ".join(sys.argv[2:]).strip()
    asyncio.run(dispatch(command, arg))

if __name__ == "__main__":
    main()
