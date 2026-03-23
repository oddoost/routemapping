import React, { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Canvas from './components/Canvas'
import { useFlowStore } from './store'

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { error?: Error }>{
  constructor(props: any) {
    super(props)
    this.state = {}
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: any) {
    console.error('Uncaught error in app:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-red-900 text-white">
          <div className="p-6">
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <pre className="mt-4 text-sm">{this.state.error?.message}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const load = useFlowStore((s) => s.load)
  const loadFromShare = useFlowStore((s) => s.loadFromShare)
  const title = useFlowStore((s) => s.title)
  const setTitle = useFlowStore((s) => s.setTitle)
  const description = useFlowStore((s) => s.description)
  const setDescription = useFlowStore((s) => s.setDescription)
  const descSize = useFlowStore((s) => s.descSize)
  const setDescSize = useFlowStore((s) => s.setDescSize)
  const save = useFlowStore((s) => s.save)
  const locked = useFlowStore((s) => s.locked)
  const showDesc = useFlowStore((s) => s.showDesc)
  const toggleShowDesc = useFlowStore((s) => s.toggleShowDesc)
  const footerText = useFlowStore((s) => s.footerText)
  const setFooterText = useFlowStore((s) => s.setFooterText)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descVisible, setDescVisible] = useState(false)
  const [editingFooter, setEditingFooter] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const footerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Check for shared data in URL
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('share')
    
    if (shareData) {
      try {
        const decoded = JSON.parse(atob(shareData))
        loadFromShare(decoded)
      } catch (err) {
        console.error('Error loading shared data:', err)
        load() // Fall back to normal load
      }
    } else {
      load()
    }
  }, [load, loadFromShare])

  useEffect(() => {
    if (editingTitle) {
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }, [editingTitle])

  // Two-step animation: width first, then content (or reverse on close)
  useEffect(() => {
    if (showDesc) {
      // Opening: wait for width transition, then show content
      const timer = setTimeout(() => setDescVisible(true), 300)
      return () => clearTimeout(timer)
    } else {
      // Closing: hide content immediately, width will shrink via CSS
      setDescVisible(false)
    }
  }, [showDesc])

  useEffect(() => {
    if (editingDesc) {
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [editingDesc])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta || !editingDesc) return
    const ro = new ResizeObserver(() => {
      setDescSize({ width: ta.offsetWidth, height: ta.offsetHeight })
    })
    ro.observe(ta)
    return () => ro.disconnect()
  }, [editingDesc, setDescSize])

  useEffect(() => {
    if (editingFooter) {
      requestAnimationFrame(() => footerRef.current?.focus())
    }
  }, [editingFooter])

  // Close all editors when locked
  useEffect(() => {
    if (locked) {
      setEditingTitle(false)
      setEditingDesc(false)
      setEditingFooter(false)
    }
  }, [locked])

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-screen bg-slate-900 text-slate-100">
        <header className="fixed bg-transparent pointer-events-none" style={{ zIndex: 100, left: 24, top: 24 }}>
          <div className="pointer-events-auto p-3" style={{
            width: 'fit-content',
            background: 'rgba(0,0,0,0.7)'
          }}>
            {editingTitle ? (
              <input
                ref={inputRef}
                className="font-semibold bg-slate-800 text-slate-100 border border-slate-600 rounded px-2 py-0.5 outline-none text-2xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); save() }}
                onKeyDown={(e) => { if (e.key === 'Enter') { setEditingTitle(false); save() } if (e.key === 'Escape') setEditingTitle(false) }}
              />
            ) : (
              <div
                className={`font-semibold px-2 text-2xl prose prose-invert max-w-none prose-headings:m-0 prose-p:m-0 cursor-pointer ${locked ? 'hover:text-white/90' : 'hover:text-white/80'}`}
                onClick={() => toggleShowDesc()}
                onDoubleClick={() => !locked && setEditingTitle(true)}
                title={locked ? 'Click to toggle description' : 'Click to toggle description · Double-click to rename'}
              >
                <ReactMarkdown>{title}</ReactMarkdown>
              </div>
            )}

            {/* Description / notes block */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: descVisible ? 500 : 0,
                opacity: descVisible ? 1 : 0,
              }}
            >
            {editingDesc ? (
              <textarea
                ref={textareaRef}
                className="mt-0 min-h-[60px] bg-slate-800 text-slate-300 text-sm border border-slate-600 rounded px-2 py-1 outline-none resize"
                style={descSize.width ? { width: descSize.width, height: descSize.height } : undefined}
                value={description}
                placeholder="Add a description…"
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => { setEditingDesc(false); save() }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingDesc(false)
                }}
              />
            ) : (
              <div
                className={`mt-0 text-sm text-slate-400 transition-colors min-h-[32px] rounded px-2 py-1 border border-transparent ${locked ? '' : 'cursor-pointer hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'}`}
                style={descSize.width ? { width: descSize.width } : undefined}
                onClick={() => !locked && setEditingDesc(true)}
                title={locked ? '' : 'Click to edit description'}
              >
                {description ? (
                  <div className="prose prose-sm prose-invert max-w-none desc-prose">
                    <ReactMarkdown>{description}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="italic text-slate-500">Add a description…</span>
                )}
              </div>
            )}
            </div>
          </div>
        </header>
        <main className="h-screen">
          <Canvas />
        </main>

        {/* Bottom-right footer text */}
        {(footerText || !locked) && (
        <div
          className="fixed bottom-6 right-6 pointer-events-auto px-2 py-1.5"
          style={{ zIndex: 100, background: 'rgba(0,0,0,0.7)', width: 'fit-content', fontSize: 14 }}
        >
          {editingFooter ? (
            <textarea
              ref={footerRef}
              className="w-full min-h-[20px] bg-slate-800 text-slate-300 border border-slate-600 rounded px-2 py-0.5 outline-none resize"
              style={{ fontSize: 14 }}
              value={footerText}
              placeholder="Add footer text… use [label](url) for links"
              onChange={(e) => setFooterText(e.target.value)}
              onBlur={() => { setEditingFooter(false); save() }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setEditingFooter(false); save() }
              }}
            />
          ) : (
            <div
              className={`text-white transition-colors rounded px-1 py-0 border border-transparent ${locked ? '' : 'cursor-pointer hover:text-white/80 hover:border-slate-600 hover:bg-slate-800/50'}`}
              style={{ fontSize: 14 }}
              onClick={() => !locked && setEditingFooter(true)}
              title={locked ? '' : 'Click to edit footer text'}
            >
              {footerText ? (
                <div className="max-w-none [&_p]:m-0 [&_p]:leading-tight" style={{ lineHeight: 1.2, fontSize: 14 }}>
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:underline" style={{ color: 'inherit' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >{footerText}</ReactMarkdown>
                </div>
              ) : (
                <span className="italic text-slate-500">Add footer text…</span>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
