const footerLinks = [
  { label: "Docs", href: "#" },
  { label: "API", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "GitHub", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[--border]">
      {/* Top fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[--border-strong] to-transparent"
      />

      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[--accent]">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M2 11 7 3l5 8H2Z" fill="white" fillOpacity="0.9" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-[--foreground]">Notebookly</span>
        </div>

        {/* Links */}
        {/* <ul className="flex items-center gap-1 flex-wrap justify-center">
          {footerLinks.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="px-3 py-1 text-xs text-[--muted] hover:text-[--foreground] transition-colors duration-150 rounded"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul> */}

        {/* Copyright */}
        <p className="text-xs text-[--muted]">
          © {new Date().getFullYear()} Notebookly
        </p>
      </div>
    </footer>
  );
}
