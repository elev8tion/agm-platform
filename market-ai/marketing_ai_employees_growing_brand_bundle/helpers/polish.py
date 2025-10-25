# helpers/polish.py
import os
from openai import OpenAI

def polish_text(text: str, model: str = None) -> str:
    """Polish long-form content to publication quality using gpt-4o.
    Falls back to original text if API call fails.
    """
    try:
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        use_model = model or os.getenv('POLISH_MODEL', 'gpt-4o')
        resp = client.responses.create(
            model=use_model,
            input=f"Polish this to publication quality. Preserve structure, headings, and lists. Improve clarity, flow, and grammar. Do not shorten unduly.\n\n{text}"
        )
        # responses.create returns output in a 'output_text' property (SDK will normalize); fallback to first text chunk
        content = getattr(resp, 'output_text', None)
        if content:
            return content
        # Fallback path for earlier SDKs
        try:
            # Some SDKs expose output as choices[0].message.content[0].text
            if hasattr(resp, 'choices') and resp.choices:
                ch = resp.choices[0]
                if hasattr(ch, 'message') and ch.message and getattr(ch.message, 'content', None):
                    parts = ch.message.content
                    if isinstance(parts, list) and parts and hasattr(parts[0], 'text'):
                        return parts[0].text
        except Exception:
            pass
        return text
    except Exception:
        return text
