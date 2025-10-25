from agents import Agent
from agents.tool import FileSearchTool, WebSearchTool
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

vector_store_id = os.getenv("VECTOR_STORE_ID")
file_search = BudgetedFileSearch(vector_store_ids=[vector_store_id] if vector_store_id else [])

cmo_agent = Agent(
    name="CMO Orchestrator",
    instructions=(
        "You are the marketing orchestrator. Break down requests and, when appropriate, "
        "delegate subtasks to specialist agents via structured prompts. "
        "Enforce brand voice and strategy loaded via File Search.\n"
        "- Honor budget guardrails; prefer File Search.\n"
        "- Use Web Search only when the KB lacks current facts.\n"
        "- Long-form flow: prewrite → outline → draft → internal links → metadata → polish.\n"
        "- Emails: subject variants → 2 body variants → pick → preheader."
    ),
    tools=[file_search, BudgetedWebSearch()],
)
