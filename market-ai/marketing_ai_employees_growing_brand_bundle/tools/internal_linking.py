from agents.tool import function_tool

@function_tool
def suggest_internal_links(slug: str = "", draft_title: str = "") -> list[dict]:
    """
    Suggest internal links for a draft based on title/slug (stub).
    Returns a list of {anchor, target_url, rationale}.
    """
    return [
        {"anchor": "podcast SEO guide", "target_url": "/blog/podcast-seo", "rationale": "Foundational resource"},
        {"anchor": "monetize your podcast", "target_url": "/blog/podcast-monetization", "rationale": "Related topic"}
    ]
