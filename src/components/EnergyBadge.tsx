"use client";

import { motion } from "framer-motion";

export function EnergyBadge({ letter }: { letter: string }) {
  let colors = "from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
  if (['A', 'B'].includes(letter)) colors = "from-green-500 to-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)] text-emerald-950";
  else if (['C', 'D'].includes(letter)) colors = "from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] text-yellow-950";

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="flex flex-col items-center justify-center p-8 relative"
    >
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
      <div className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4 relative z-10">
        Classe Energetica
      </div>
      <div
        className={`w-32 h-32 md:w-48 md:h-48 flex items-center justify-center rounded-2xl bg-gradient-to-br ${colors} font-black text-7xl md:text-9xl relative z-10 border border-white/20`}
      >
        {letter}
      </div>
    </motion.div>
  );
}
