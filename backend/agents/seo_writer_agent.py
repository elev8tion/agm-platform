"""
SEO Writer Agent
Handles content creation with SEO optimization
"""
from typing import Dict, Any, Optional
from loguru import logger
from agents.base import BaseAgent


class SEOWriterAgent(BaseAgent):
    """Agent for SEO content writing and optimization"""

    def get_system_prompt(self) -> str:
        return """You are an expert SEO content writer with deep knowledge of search engine optimization,
content marketing, and digital strategy. Your goal is to create high-quality, engaging content
that ranks well in search engines while providing value to readers.

Key responsibilities:
- Research topics thoroughly
- Create detailed content outlines
- Write SEO-optimized articles with proper keyword placement
- Generate meta descriptions and title tags
- Include FAQs and structured data
- Optimize for user intent and readability"""

    async def execute(self, command: str, **kwargs) -> Dict[str, Any]:
        """
        Execute SEO Writer command

        Args:
            command: One of 'research', 'write', 'optimize'
            **kwargs: Command-specific parameters
        """
        if command == "research":
            return await self.research(**kwargs)
        elif command == "write":
            return await self.write(**kwargs)
        elif command == "optimize":
            return await self.optimize(**kwargs)
        else:
            raise ValueError(f"Unknown command: {command}")

    async def research(
        self,
        topic: str,
        target_audience: Optional[str] = None,
        depth: str = "medium",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Research topic and generate content outline

        Args:
            topic: Research topic
            target_audience: Target audience description
            depth: Research depth (shallow, medium, deep)
        """
        logger.info(f"Researching topic: {topic}")

        prompt = f"""Research the topic: {topic}

Depth level: {depth}
{f"Target audience: {target_audience}" if target_audience else ""}

Provide:
1. Key points and subtopics
2. Recommended keywords
3. Content outline with H2/H3 structure
4. Target word count recommendation
5. Suggested internal/external resources"""

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
                "outline": content,
                "topic": topic,
                "depth": depth,
                "tokens_used": response.usage.total_tokens,
                "cost": self._calculate_cost(response.usage)
            }

        except Exception as e:
            logger.error(f"Research failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def write(
        self,
        brief: str,
        keyword: Optional[str] = None,
        word_count: int = 1500,
        tone: str = "professional",
        include_faqs: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Write SEO-optimized content

        Args:
            brief: Content brief/instructions
            keyword: Primary keyword to target
            word_count: Target word count
            tone: Content tone
            include_faqs: Whether to include FAQ section
        """
        logger.info(f"Writing content: {brief[:100]}...")

        # Stage 1: Draft with GPT-4o-mini (cost optimization)
        draft_prompt = f"""Write a comprehensive article based on this brief:

{brief}

Requirements:
- Target word count: {word_count}
- Tone: {tone}
{f"- Primary keyword: {keyword} (use naturally throughout)" if keyword else ""}
{f"- Include FAQ section at the end" if include_faqs else ""}
- Use proper heading structure (H2, H3)
- Include introduction and conclusion
- Make it engaging and informative"""

        try:
            # Draft
            draft_response = await self.client.chat.completions.acreate(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": draft_prompt}
                ],
                temperature=0.7,
            )

            draft_content = draft_response.choices[0].message.content

            # Stage 2: Polish with GPT-4o (quality enhancement)
            polish_prompt = f"""Polish and enhance this content for publication:

{draft_content}

Improvements needed:
- Refine language and flow
- Ensure SEO best practices
- Verify keyword placement
- Add meta description
- Ensure readability and engagement"""

            polish_response = await self.client.chat.completions.acreate(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert content editor and SEO specialist."},
                    {"role": "user", "content": polish_prompt}
                ],
                temperature=0.5,
            )

            final_content = polish_response.choices[0].message.content

            # Calculate total cost
            total_tokens = draft_response.usage.total_tokens + polish_response.usage.total_tokens
            total_cost = (
                self._calculate_cost(draft_response.usage, model="gpt-4o-mini") +
                self._calculate_cost(polish_response.usage, model="gpt-4o")
            )

            return {
                "success": True,
                "content": final_content,
                "word_count": len(final_content.split()),
                "tokens_used": total_tokens,
                "cost": total_cost,
                "keyword": keyword,
                "tone": tone
            }

        except Exception as e:
            logger.error(f"Content writing failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def optimize(
        self,
        url: str,
        target_keyword: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Analyze and optimize existing content

        Args:
            url: URL of content to optimize
            target_keyword: Keyword to optimize for
        """
        logger.info(f"Optimizing content at: {url}")

        # Note: In production, you'd fetch the content from the URL
        # For now, return a placeholder
        return {
            "success": True,
            "message": "Content optimization not yet implemented - requires web scraping",
            "url": url,
            "recommendations": [
                "Add target keyword to H1",
                "Improve meta description",
                "Add internal links",
                "Optimize images with alt text",
                "Increase content length to 2000+ words"
            ]
        }

    def _calculate_cost(self, usage, model: str = None) -> float:
        """Calculate API call cost"""
        model = model or self.model

        # Pricing per 1M tokens (as of January 2025)
        pricing = {
            "gpt-4o": {
                "prompt": 2.50 / 1_000_000,
                "completion": 10.00 / 1_000_000
            },
            "gpt-4o-mini": {
                "prompt": 0.150 / 1_000_000,
                "completion": 0.600 / 1_000_000
            }
        }

        model_pricing = pricing.get(model, pricing["gpt-4o"])
        prompt_cost = usage.prompt_tokens * model_pricing["prompt"]
        completion_cost = usage.completion_tokens * model_pricing["completion"]

        return prompt_cost + completion_cost
