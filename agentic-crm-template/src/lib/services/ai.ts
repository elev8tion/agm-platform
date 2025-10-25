import OpenAI from 'openai';
import { dataStore } from './dataStore';

const USE_MOCK = process.env.USE_MOCK_OPENAI !== 'false';

const openai = USE_MOCK ? null : new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ComposeInput = {
  channelId: string;
  prompt: string;
  model?: string;
  context?: {
    propertyId?: string;
    leadId?: string;
    purpose?: 'listing' | 'followup' | 'offer' | 'general';
  };
};

type SummarizeInput = {
  channelId: string;
  model?: string;
};

class AIService {
  async compose(input: ComposeInput): Promise<string> {
    if (USE_MOCK) {
      return this.mockCompose(input);
    }

    const messages = await dataStore.getMessages(input.channelId);
    const channel = (await dataStore.listChannels('')).find(ch => ch.id === input.channelId);

    let systemPrompt = this.getSystemPrompt(input.context?.purpose);

    // Add context if available
    if (input.context?.propertyId) {
      const property = await dataStore.getProperty(input.context.propertyId);
      if (property) {
        systemPrompt += `\n\nProperty Context: ${property.address}, ${property.city}, ${property.state} - $${property.price.toLocaleString()} - ${property.bedrooms}bed/${property.bathrooms}bath`;
      }
    }

    if (input.context?.leadId) {
      const lead = await dataStore.getLead(input.context.leadId);
      if (lead) {
        systemPrompt += `\n\nLead Context: ${lead.name} (${lead.email}) - Status: ${lead.status}`;
      }
    }

    const response = await openai!.chat.completions.create({
      model: input.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Channel: #${channel?.name}\n\nRequest: ${input.prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || 'Unable to generate message.';
  }

  async summarize(input: SummarizeInput): Promise<string> {
    if (USE_MOCK) {
      return this.mockSummarize(input);
    }

    const messages = await dataStore.getMessages(input.channelId);
    const channel = (await dataStore.listChannels('')).find(ch => ch.id === input.channelId);

    if (messages.length === 0) {
      return 'No messages to summarize.';
    }

    const members = await dataStore.getMembers('');
    const conversationText = messages
      .map(msg => {
        const author = members.find(m => m.id === msg.authorId);
        return `${author?.name || 'Unknown'}: ${msg.body}`;
      })
      .join('\n');

    const response = await openai!.chat.completions.create({
      model: input.model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a real estate CRM. Summarize conversations about properties, leads, and transactions concisely and professionally. Focus on action items, key decisions, and important details.`
        },
        {
          role: 'user',
          content: `Summarize this conversation from #${channel?.name}:\n\n${conversationText}`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    return response.choices[0]?.message?.content || 'Unable to generate summary.';
  }

  private getSystemPrompt(purpose?: string): string {
    const base = 'You are an AI assistant for a real estate CRM platform. Help agents communicate professionally and effectively.';

    switch (purpose) {
      case 'listing':
        return `${base} Generate compelling property listing descriptions that highlight key features, location benefits, and appeal to potential buyers. Be descriptive yet concise.`;
      case 'followup':
        return `${base} Generate personalized follow-up messages for leads. Be friendly, professional, and create urgency without being pushy. Reference specific properties or previous conversations when relevant.`;
      case 'offer':
        return `${base} Generate professional messages related to offers and negotiations. Be clear, factual, and maintain a business tone while being personable.`;
      default:
        return `${base} Generate professional, helpful messages appropriate for real estate team communication.`;
    }
  }

  private mockCompose(input: ComposeInput): string {
    const templates: Record<string, string> = {
      listing: `🏡 Stunning property alert! This beautiful home features modern updates throughout, a spacious layout perfect for entertaining, and is situated in a highly desirable neighborhood. Schedule your showing today!`,
      followup: `Hi! I wanted to follow up on the property we discussed. I've found a few additional listings that match your criteria perfectly. Would you have time for a quick call this week to review them?`,
      offer: `Thank you for your offer submission. We've received it and are currently reviewing all proposals with the seller. I'll be in touch within 24 hours with next steps. Feel free to reach out with any questions!`,
      general: `Thanks for reaching out! I'd be happy to help you with that. Let's schedule a time to discuss the details further and explore your options.`
    };

    return templates[input.context?.purpose || 'general'] || templates.general;
  }

  private mockSummarize(input: SummarizeInput): string {
    return `📋 **Conversation Summary**

**Key Points:**
- New property listing discussed: 4 bed/3 bath luxury home
- 3 qualified leads generated from recent open house
- Follow-up scheduled with interested buyers
- Price point confirmed at $2.5M

**Action Items:**
- Schedule property viewings for qualified leads
- Prepare comparable market analysis
- Update listing photos and description

*Summary generated by AI*`;
  }
}

export const aiService = new AIService();
