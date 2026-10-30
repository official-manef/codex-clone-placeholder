export type AiProvider = 'openai' | 'anthropic' | 'google' | 'nine-router';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ChatEvent =
	{ type: 'text'; text: string } | { type: 'error'; message: string } | { type: 'done' };
