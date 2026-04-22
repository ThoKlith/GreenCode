"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";

interface EcoFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippet: {
    id: string;
    filename: string;
    code?: string;
  };
}

export function EcoFixModal({ isOpen, onClose, snippet }: EcoFixModalProps) {
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState(snippet.code || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFix = async () => {
    setError(null);

    if (!inputCode.trim()) {
      setError("Incolla prima il blocco di codice da ottimizzare.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/eco-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inputCode,
          filename: snippet.filename,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante la generazione Eco-Fix.");
        return;
      }

      if (data.fixedCode) setFixedCode(data.fixedCode);
    } catch (e) {
      console.error(e);
      setError("Errore di rete durante Eco-Fix.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset dopo che l'animazione di chiusura è consegnata
      setTimeout(() => {
        setFixedCode(null);
        setInputCode(snippet.code || "");
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto bg-background/95 border-border backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            Eco-Fix AI
          </DialogTitle>
          <DialogDescription>
            Ottimizzazione assistita per {snippet.filename}
          </DialogDescription>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 relative">
          
          {/* Prima */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-destructive/20 text-xs font-semibold text-red-300">
              PRIMA (Originale, locale)
            </div>
            <div className="p-4 flex-1 space-y-3">
              <p className="text-xs text-red-200/80">
                Per privacy il report salva solo metadati. Incolla qui il blocco di codice da ottimizzare.
              </p>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full min-h-[240px] bg-black/60 border border-white/10 rounded-md p-3 text-sm font-mono text-red-200"
                placeholder="Incolla qui il codice del file per Eco-Fix"
              />
            </div>
          </div>

          {/* Freccia */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background rounded-full items-center justify-center border border-border z-10 shadow-lg">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Dopo */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl overflow-hidden flex flex-col relative min-h-[200px]">
             <div className="px-4 py-2 bg-primary/20 text-xs font-semibold text-emerald-300">
              DOPO (Eco-Optimized)
            </div>
            {!fixedCode && !loading && (
              <div className="flex-1 flex items-center justify-center p-8">
                <Button onClick={handleFix} size="lg" className="shadow-[0_0_15px_rgba(20,250,150,0.4)]">
                  Genera Refactoring AI
                </Button>
              </div>
            )}
            {loading && (
              <div className="flex-1 flex items-center justify-center flex-col space-y-4 p-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-primary animate-pulse">L&apos;intelligenza artificiale sta lavorando...</p>
              </div>
            )}
            {fixedCode && (
              <pre className="p-4 overflow-auto text-sm font-mono text-emerald-200 flex-1 bg-primary/5 whitespace-pre-wrap break-words max-h-[50vh]">
                <code>{fixedCode}</code>
              </pre>
            )}
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
