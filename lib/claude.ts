import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

export function getClaudeClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

export async function callClaude(prompt: string, model: string = 'claude-sonnet-4-5-20250929') {
  try {
    const client = getClaudeClient();
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

