export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-text-strong">web-test-1</span>
        <nav className="flex gap-6 text-sm">
          <a className="hover:text-accent" href="https://react.dev" target="_blank" rel="noreferrer">
            React
          </a>
          <a className="hover:text-accent" href="https://vite.dev" target="_blank" rel="noreferrer">
            Vite
          </a>
          <a
            className="hover:text-accent"
            href="https://developers.cloudflare.com/workers/"
            target="_blank"
            rel="noreferrer"
          >
            Cloudflare
          </a>
        </nav>
      </div>
    </header>
  )
}
