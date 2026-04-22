"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { API_KEY_STORAGE, API_PROVIDER_STORAGE, ApiProvider, inferProviderFromKey } from "@/lib/byok";

export function ApiKeySettingsButton() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(API_KEY_STORAGE) || "";
  });
  const [provider, setProvider] = useState<ApiProvider>(() => {
    if (typeof window === "undefined") return "gemini";
    const storedKey = localStorage.getItem(API_KEY_STORAGE) || "";
    const storedProvider = localStorage.getItem(API_PROVIDER_STORAGE) as ApiProvider | null;
    return storedProvider || (storedKey ? inferProviderFromKey(storedKey) : "gemini");
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      localStorage.removeItem(API_KEY_STORAGE);
      localStorage.removeItem(API_PROVIDER_STORAGE);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      return;
    }

    localStorage.setItem(API_KEY_STORAGE, cleanKey);
    localStorage.setItem(API_PROVIDER_STORAGE, provider);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <KeyRound className="w-4 h-4" />
            API Key
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impostazioni API Key</DialogTitle>
          <DialogDescription>
            La chiave viene salvata solo nel browser (localStorage) e usata per Eco-Fix.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Provider</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={provider === "gemini" ? "default" : "outline"}
                onClick={() => setProvider("gemini")}
                className="flex-1"
              >
                Gemini
              </Button>
              <Button
                type="button"
                variant={provider === "openai" ? "default" : "outline"}
                onClick={() => setProvider("openai")}
                className="flex-1"
              >
                OpenAI
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">API Key personale</label>
            <Input
              value={apiKey}
              onChange={(e) => {
                const value = e.target.value;
                setApiKey(value);
                if (value.startsWith("sk-")) setProvider("openai");
                if (value.startsWith("AIza")) setProvider("gemini");
              }}
              placeholder="Incolla qui la tua API key"
            />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Vuoto = rimuovi la chiave salvata.
            </p>
            <Button onClick={save}>{saved ? "Salvata" : "Salva"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
