import { Link } from 'react-router'

export function HomePage() {
  return (
    <section className="mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-3xl font-medium text-text-strong sm:text-4xl">
        Bem-vindo ao sistema de clientes
      </h1>
      <Link
        to="/clientes"
        state={{ openCreate: true }}
        className="rounded-md bg-accent px-6 py-3 text-sm font-medium tracking-wide text-white uppercase"
      >
        Novo cadastro
      </Link>
    </section>
  )
}
