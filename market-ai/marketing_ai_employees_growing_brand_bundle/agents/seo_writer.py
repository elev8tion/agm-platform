from agents import Agent
from agents.tool import FileSearchTool, WebSearchTool, function_tool
from budget import BUDGET
import os

# Budgeted wrappers
class BudgetedWebSearch(WebSearchTool):
    async def __call__(self, *args, **kwargs):
        if not BUDGET.allow("web"):
            return "Budget cap reached: web-search disabled."
        return await super().__call__(*args, **kwargs)

class BudgetedFileSearch(FileSearchTool):
    async def __call__(self, *args, **kwargs):
        if not BUDGET.allow("file"):
            return "Budget cap reached: file-search disabled."
        return await super().__call__(*args, **kwargs)

# stub tools
@function_tool
def analyze_search_console(site: str = "example.com") -> str:
    """Pull basic Search Console opportunities (stub)."""
    return '{"opportunities":[{"url":"/blog/sample","kw":"podcast ads","pos":11}]}'

@function_tool
def suggest_internal_links(slug: str = "", draft_title: str = "") -> list[dict]:
    """Suggest internal links for a draft (stub)."""
    return [
        {"anchor": "podcast SEO guide", "target_url": "/blog/podcast-seo", "rationale": "Foundational resource"},
        {"anchor": "monetize your podcast", "target_url": "/blog/podcast-monetization", "rationale": "Related topic"}
    ]

@function_tool
def write_metadata(title: str = "", primary_kw: str = "") -> dict:
    """Generate SEO metadata (stub)."""
    tt = f"{title} | {primary_kw} — YourBrand"
    md = f"Learn {primary_kw} with this in-depth guide. Practical tactics and examples to execute today."
    return {"title_tag": tt[:60], "meta_description": md[:155]}

vector_store_id = os.getenv("VECTOR_STORE_ID")
file_search = BudgetedFileSearch(vector_store_ids=[vector_store_id] if vector_store_id else [])

seo_writer = Agent(
    name="SEO Content Writer",
    instructions=(
        "Write authoritative, 4,000+ word SEO pieces that follow our brand voice and SEO rules. "
        "Use File Search to absorb brand voice and prior examples.\n"
        "Slash:/research → research dossier + 8–12 section outline, grounded in KB; selectively use Web Search.\n"
        "Slash:/write → full article: H1; intro (pain→promise); H2/H3 per outline; examples; 5 FAQs; Article+FAQ schema hints; CTA.\n"
        "Then call tools: suggest_internal_links, write_metadata.\n"
        "If permitted by budget, perform a final polish pass with gpt-4o."
    ),
    tools=[file_search, BudgetedWebSearch(), analyze_search_console, suggest_internal_links, write_metadata],
)
