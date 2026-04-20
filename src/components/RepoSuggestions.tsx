"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Repo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updated_at: string;
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-600",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  "C#": "bg-purple-500",
  Ruby: "bg-red-400",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  Dart: "bg-sky-500",
  HTML: "bg-orange-500",
  CSS: "bg-blue-400",
  Shell: "bg-emerald-500",
};

export function RepoSuggestions({ onSelect }: { onSelect: (url: string) => void }) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const res = await fetch("/api/repos");
        const data = await res.json();
        setRepos(data.repos || []);
      } catch {
        setRepos([]);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, []);

  if (!isLoggedIn || loading || repos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-12 w-full max-w-4xl"
    >
      <div className="flex items-center space-x-2 text-primary font-medium px-2 mb-4">
        <GitBranch className="w-5 h-5" />
        <h2>Le tue repository</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {repos.map((repo, i) => (
          <motion.div
            key={repo.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
          >
            <Card
              onClick={() => onSelect(repo.url)}
              className="bg-card/40 backdrop-blur border-border/50 hover:border-primary/50 transition-all hover:bg-card/70 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate flex-1" title={repo.name}>
                    {repo.name.split("/")[1] || repo.name}
                  </p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
                {repo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {repo.language && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                      <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || "bg-gray-400"}`} />
                      {repo.language}
                    </Badge>
                  )}
                  {repo.stars > 0 && (
                    <span className="flex items-center text-[10px] text-muted-foreground gap-0.5">
                      <Star className="w-3 h-3" /> {repo.stars}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
