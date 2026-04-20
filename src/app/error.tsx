"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Qualcosa è andato storto</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message || "Si è verificato un errore imprevisto."}
      </p>
      <p className="text-xs text-muted-foreground mb-6 font-mono">
        {error.digest && `Digest: ${error.digest}`}
      </p>
      <Button onClick={() => reset()}>Riprova</Button>
    </div>
  );
}
