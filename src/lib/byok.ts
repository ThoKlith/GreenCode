export const API_KEY_STORAGE = 'ecocode.userApiKey';
export const API_PROVIDER_STORAGE = 'ecocode.userApiProvider';

export type ApiProvider = 'gemini' | 'openai';

export function inferProviderFromKey(key: string): ApiProvider {
  if (key.startsWith('sk-')) return 'openai';
  return 'gemini';
}
