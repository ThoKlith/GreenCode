import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
        <p className="text-muted-foreground">
          EcoCode applica metriche computazionali e profilazione dinamica per una software engineering verificabile.
        </p>
        <nav className="flex items-center gap-5 text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
        </nav>
      </div>
    </footer>
  );
}
