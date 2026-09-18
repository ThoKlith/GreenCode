import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link href="/" className="transition-opacity hover:opacity-90" aria-label="GreenCode Home">
            <Logo size="sm" />
          </Link>
          <span className="hidden sm:inline text-muted-foreground/30">|</span>
          <p className="text-muted-foreground">
            GreenCode applies computational metrics and dynamic profiling for verifiable software engineering.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-muted-foreground shrink-0">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
        </nav>
      </div>
    </footer>
  );
}
