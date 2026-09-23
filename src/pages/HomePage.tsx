import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHistory, removeFromHistory, type CardHistory } from '../utils/history'

export function HomePage() {
  const [history, setHistory] = useState<CardHistory[]>([])
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleRemove = (id: string) => {
    removeFromHistory(id)
    setHistory(getHistory())
  }

  const handleCopy = async (link: string) => {
    const card = history.find((c) => c.link === link)
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    if (card) {
      setCopiedId(card.id)
      setTimeout(() => setCopiedId(''), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f9] via-[#ffe4ef] to-white font-sans text-blossom-900 antialiased">
      {/* Hero */}
      <header className="px-5 pt-14 pb-6 text-center">
        <p className="mb-2 text-4xl" style={{ animation: 'pulse-heart 1.5s ease-in-out infinite' }}>♡</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-blossom-600 sm:text-4xl">
          Cute Free Template
        </h1>
        <p className="mt-2 text-sm font-medium text-blossom-400">
          Create a beautiful animated anniversary card — completely free ♡
        </p>
      </header>

      {/* Demo Preview */}
      <section className="mx-auto max-w-xs px-5">
        <div className="mx-auto w-full overflow-hidden rounded-[1.8rem] border-2 border-blossom-200/60 bg-white/70 p-3 shadow-lg shadow-blossom-200/30 backdrop-blur-sm">
          <div className="relative mx-auto h-36 w-full">
            <div className="absolute left-1/2 top-2 h-28 w-44 -translate-x-1/2 -rotate-6 rounded-2xl bg-gradient-to-br from-blossom-200 to-blossom-300 shadow-md" />
            <div className="absolute left-1/2 top-1 h-28 w-44 -translate-x-1/2 rotate-3 rounded-2xl bg-gradient-to-br from-blossom-300 to-blossom-400 shadow-md" />
            <div className="absolute left-1/2 top-0 h-28 w-44 -translate-x-1/2 rounded-2xl bg-gradient-to-br from-blossom-500 to-blossom-600 p-3 shadow-lg">
              <div className="flex h-full items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm text-blossom-500">♥</div>
                <div>
                  <p className="text-[10px] font-bold leading-tight text-white">Happy Anniversary</p>
                  <p className="text-[8px] text-white/70">3 Years ♡</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-blossom-400">
            ✦ Swipe cards · Flip · Unlock · Note ✦
          </p>
        </div>
      </section>

      {/* Last Used */}
      <section className="mx-auto mt-8 max-w-sm px-5">
        <h2 className="mb-3 text-center font-display text-lg font-bold text-blossom-600">
          Recent Template
        </h2>
        {history.length > 0 ? (
          <div className="space-y-2.5">
            {history.map((card) => (
              <div
                key={card.id}
                className="overflow-hidden rounded-2xl bg-white/80 shadow-sm shadow-blossom-100 backdrop-blur-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg">💌</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-blossom-700">{card.title}</p>
                    <p className="text-[10px] text-blossom-400">
                      {new Date(card.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(card.id)}
                    className="shrink-0 rounded-full p-1.5 text-xs text-blossom-300 transition hover:bg-blossom-50 hover:text-blossom-500"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-1.5 border-t border-blossom-100 px-3 py-2">
                  <a
                    href={card.link}
                    className="flex-1 rounded-full bg-blossom-100 py-1.5 text-center text-[11px] font-bold text-blossom-600 transition hover:bg-blossom-200"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleCopy(card.link)}
                    className="flex-1 rounded-full bg-blossom-50 py-1.5 text-center text-[11px] font-bold text-blossom-500 transition hover:bg-blossom-100"
                  >
                    {copiedId === card.id ? '✓ Copied' : 'Copy URL'}
                  </button>
                  <Link
                    to="/create"
                    className="flex-1 rounded-full bg-blossom-50 py-1.5 text-center text-[11px] font-bold text-blossom-500 transition hover:bg-blossom-100"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white/60 px-6 py-6 text-center shadow-sm shadow-blossom-100 backdrop-blur-sm">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm font-medium text-blossom-400">No cards yet</p>
            <p className="mt-0.5 text-xs text-blossom-300">Create your first card and it will appear here</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto mt-8 max-w-sm px-5">
        <div className="grid grid-cols-3 gap-3">
          <Link to="/create" className="rounded-2xl bg-white/80 p-4 text-center shadow-sm shadow-blossom-100 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-2xl">🖼</p>
            <p className="mt-1.5 text-[11px] font-semibold text-blossom-600">Upload Photos</p>
          </Link>
          <Link to="/create" className="rounded-2xl bg-white/80 p-4 text-center shadow-sm shadow-blossom-100 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-2xl">✍️</p>
            <p className="mt-1.5 text-[11px] font-semibold text-blossom-600">Custom Text</p>
          </Link>
          <Link to="/customize" state={{ mode: 'save' }} className="rounded-2xl bg-white/80 p-4 text-center shadow-sm shadow-blossom-100 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-2xl">🎨</p>
            <p className="mt-1.5 text-[11px] font-semibold text-blossom-600">Customize Color</p>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-8 max-w-sm px-5">
        <h2 className="mb-4 text-center font-display text-lg font-bold text-blossom-600">
          How it works
        </h2>
        <div className="space-y-3">
          {[
            'Upload your photos & write your message',
            'Preview your animated card in real-time',
            'Get a link & share it with your loved one ♡',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm shadow-blossom-100 backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blossom-100 text-sm font-bold text-blossom-500">
                {i + 1}
              </span>
              <p className="text-sm font-medium text-blossom-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 pb-24 text-center">
        <p className="text-xs text-blossom-300">Made with ♡ · Cute Free Template</p>
      </footer>

      {/* Floating CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-5 pt-3" style={{ background: 'linear-gradient(transparent, #fff5f9 40%)' }}>
        <Link
          to="/create"
          className="mx-auto block max-w-sm rounded-full bg-gradient-to-r from-blossom-500 to-blossom-600 py-4 text-center text-base font-bold tracking-wide text-white shadow-lg shadow-blossom-300/40 transition hover:-translate-y-1 hover:shadow-xl"
        >
          Use Template ♡
        </Link>
      </div>
    </div>
  )
}
