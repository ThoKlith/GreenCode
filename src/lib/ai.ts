// Provider AI configurabile (OpenAI-compatibile). Cambia provider con la env AI_PROVIDER
// senza toccare il codice: "openai" (default, affidabile) oppure "nvidia" (richiesto da Nebius).
// Fa fallback all'altro provider se la key scelta non è configurata.

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  models: string[];
}

const OPENAI: AiConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY || "",
  models: ["gpt-4o-mini", "gpt-4o"],
};

const NVIDIA: AiConfig = {
  baseUrl: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
  models: [
    "google/gemma-4-31b-it",
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/nemotron-3-ultra-550b-a55b",
  ],
};

export function getAiConfig(): AiConfig {
  const want = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const wantNvidia = want === "nvidia";

  // Provider preferito se ha la key, altrimenti fallback all'altro se disponibile.
  if (wantNvidia && NVIDIA.apiKey) return NVIDIA;
  if (!wantNvidia && OPENAI.apiKey) return OPENAI;
  if (OPENAI.apiKey) return OPENAI;
  if (NVIDIA.apiKey) return NVIDIA;

  // Nessuna key: restituisce config vuota (il chiamante lancia un errore chiaro).
  return { baseUrl: "", apiKey: "", models: [] };
}
