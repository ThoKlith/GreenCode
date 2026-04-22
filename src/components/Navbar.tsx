"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import AuthButton from "./AuthButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(20,250,150,0.8)]" />
          <span className="hidden font-bold sm:inline-block text-xl tracking-tight text-white drop-shadow-md">
            EcoCode
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
