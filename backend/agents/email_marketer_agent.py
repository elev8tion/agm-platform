"""
Email Marketer Agent
Handles email campaign creation and optimization
"""
from typing import Dict, Any, Optional
from loguru import logger
from agents.base import BaseAgent


class EmailMarketerAgent(BaseAgent):
    """Agent for email marketing and campaign creation"""

    def get_system_prompt(self) -> str:
        return """You are an expert email marketing specialist with deep knowledge of email campaigns,
copywriting, conversion optimization, and marketing automation.

Key responsibilities:
- Create compelling email copy that drives engagement
- Optimize subject lines for open rates
- Design email sequences and nurture campaigns
- Ensure brand voice consistency
- Include clear calls-to-action"""

    async def execute(self, command: str, **kwargs) -> Dict[str, Any]:
        """Execute Email Marketer command"""
        if command == "create":
            return await self.create_email(**kwargs)
        elif command == "series":
            return await self.create_series(**kwargs)
        else:
            raise ValueError(f"Unknown command: {command}")

    async def create_email(
        self,
        brief: str,
        subject_line: Optional[str] = None,
        tone: str = "friendly",
        include_cta: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """Create a single marketing email"""
        logger.info(f"Creating email: {brief[:100]}...")

        prompt = f"""Create a marketing email based on this brief:

{brief}

Requirements:
- Tone: {tone}
{f"- Subject line: {subject_line}" if subject_line else "- Generate an engaging subject line"}
{f"- Include a clear call-to-action" if include_cta else ""}
- Preview text
- Well-structured body copy
- Professional sign-off"""

        try:
            response = await self.client.chat.completions.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
            )

            content = response.choices[0].message.content

            return {
                "success": True,
                "subject": subject_line or "Generated Subject Line",
                "body": content,
                "tone": tone,
                "tokens_used": response.usage.total_tokens,
                "cost": self._calculate_cost(response.usage)
            }

        except Exception as e:
            logger.error(f"Email creation failed: {e}")
            return {"success": False, "error": str(e)}

    async def create_series(
        self,
        brief: str,
        num_emails: int = 5,
        frequency: str = "daily",
        goal: str = "conversion",
        **kwargs
    ) -> Dict[str, Any]:
        """Create email series/sequence"""
        logger.info(f"Creating email series: {num_emails} emails")

        prompt = f"""Create a {num_emails}-email sequence based on this brief:

{brief}

Requirements:
- Number of emails: {num_emails}
- Send frequency: {frequency}
- Campaign goal: {goal}
- Progressive narrative arc
- Consistent branding
- Strategic CTAs

For each email, provide:
1. Subject line
2. Preview text
3. Email body
4. CTA
5. Send timing recommendation"""

        try:
            response = await self.client.chat.completions.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )

            content = response.choices[0].message.content

            return {
                "success": True,
                "series": content,
                "num_emails": num_emails,
                "frequency": frequency,
                "goal": goal,
                "tokens_used": response.usage.total_tokens,
                "cost": self._calculate_cost(response.usage)
            }

        except Exception as e:
            logger.error(f"Email series creation failed: {e}")
            return {"success": False, "error": str(e)}

    def _calculate_cost(self, usage) -> float:
        """Calculate API call cost"""
        pricing = {
            "gpt-4o": {"prompt": 2.50 / 1_000_000, "completion": 10.00 / 1_000_000},
            "gpt-4o-mini": {"prompt": 0.150 / 1_000_000, "completion": 0.600 / 1_000_000}
        }
        model_pricing = pricing.get(self.model, pricing["gpt-4o"])
        return (usage.prompt_tokens * model_pricing["prompt"] +
                usage.completion_tokens * model_pricing["completion"])
