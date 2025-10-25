from agents.tool import function_tool

@function_tool
def write_metadata(title: str = "", primary_kw: str = "") -> dict:
    """
    Generate SEO metadata (stub). Returns {title_tag, meta_description}.
    """
    tt = f"{title} | {primary_kw} — YourBrand"
    md = f"Learn {primary_kw} with this in-depth guide. Practical tactics and examples to execute today."
    return {"title_tag": tt[:60], "meta_description": md[:155]}
