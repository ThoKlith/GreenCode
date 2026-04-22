"use client";

import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  delay?: number;
  theme?: "danger" | "success" | "neutral";
  infoTitle: string;
  infoDescription: string;
}

export function MetricCard({ title, value, suffix, icon, delay = 0, theme = "neutral", infoTitle, infoDescription }: MetricCardProps) {
  let themeStyles = "text-primary border-primary/20";
  if (theme === "danger") themeStyles = "text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
  if (theme === "success") themeStyles = "text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]";

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className={`bg-card/40 backdrop-blur border ${themeStyles} relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-muted-foreground truncate">{title}</h3>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label={`Informazioni su ${title}`}
                    />
                  }
                >
                  <Info className="h-3.5 w-3.5" />
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{infoTitle}</DialogTitle>
                    <DialogDescription>{infoDescription}</DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div className={`w-5 h-5 ${themeStyles.split(' ')[0]}`}>{icon}</div>
          </div>
          <div className="flex items-end space-x-1">
            <span className="text-4xl font-extrabold tracking-tight">{value}</span>
            {suffix && <span className="text-lg text-muted-foreground mb-1">{suffix}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
