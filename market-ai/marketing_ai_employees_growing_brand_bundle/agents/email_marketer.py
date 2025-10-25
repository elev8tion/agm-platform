from agents import Agent
from agents.tool import FileSearchTool, function_tool
from budget import BUDGET
import os

class BudgetedFileSearch(FileSearchTool):
    async def __call__(self, *args, **kwargs):
        if not BUDGET.allow("file"):
            return "Budget cap reached: file-search disabled."
        return await super().__call__(*args, **kwargs)

@function_tool
def select_subject_lines(goal: str) -> list[str]:
    """Return 3 punchy subject lines aligned to the goal/context."""
    return [f"{goal} — Quick Wins Inside", f"Level up fast: {goal}", f"{goal}: your blueprint"]

vector_store_id = os.getenv("VECTOR_STORE_ID")
file_search = BudgetedFileSearch(vector_store_ids=[vector_store_id] if vector_store_id else [])

email_marketer = Agent(
    name="Email Marketer",
    instructions=(
        "Create high-converting SaaS emails (single sends, sequences, and autoresponders). "
        "Leverage context via File Search (brand voice, examples, best practices). "
        "Respect length, tone, and CTAs. "
        "Slash:/create-email → one email with preheader + 2 body variants + 3 subjects. "
        "Slash:/create-series → a 4–6 email series, with timing and goals."
    ),
    tools=[file_search, select_subject_lines],
)
