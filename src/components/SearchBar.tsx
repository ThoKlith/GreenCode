"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes("github.com")) return;
    
    setIsAnalyzing(true);
    // Passa l'url ai query parameter per la result dashboard
    router.push(`/results?repo=${encodeURIComponent(url)}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 relative z-10">
      <form onSubmit={handleSearch} className="relative flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Incolla l'URL della repository GitHub (es. https://github.com/user/repo)"
            className="w-full pl-12 pr-4 py-8 text-lg md:text-xl rounded-2xl bg-black/40 border-primary/30 text-white placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary shadow-[0_0_15px_rgba(20,250,150,0.15)] transition-all duration-300 focus-visible:shadow-[0_0_30px_rgba(20,250,150,0.3)] backdrop-blur-sm"
            required
            pattern="https://github.com/.*"
          />
        </div>
        <Button 
          type="submit" 
          disabled={isAnalyzing || !url} 
          className="w-full md:w-auto py-8 px-8 text-lg rounded-2xl font-semibold shadow-[0_0_15px_rgba(20,250,150,0.3)] hover:shadow-[0_0_40px_rgba(20,250,150,0.5)] transition-all duration-500 overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center"
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Avvio Scansione...
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Analizza Impatto
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </form>
    </div>
  );
}
