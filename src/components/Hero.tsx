import { useState } from 'react'

export function Hero() {
  const [count, setCount] = useState(0)

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
        React + Vite, pronto para a Cloudflare
      </h1>
      <p className="max-w-xl text-base">
        Edite <code className="rounded bg-surface px-1.5 py-0.5">src/App.tsx</code> e salve para
        testar o HMR.
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-md border-2 border-transparent bg-accent-soft px-4 py-2 font-mono text-accent transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        count is {count}
      </button>
    </section>
  )
}
