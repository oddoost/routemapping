import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  MarkerType,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  OnConnect,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useFlowStore } from '../store'
import { GRID_DOT_COLOR, GRID_DOT_SIZE } from '../config'
import MarkdownNode from './NodeTypes/MarkdownNode'
import ImageNode from './NodeTypes/ImageNode'
import IframeNode from './NodeTypes/IframeNode'
import EdgeContextMenu from './EdgeContextMenu'

const nodeTypes = { markdown: MarkdownNode, image: ImageNode, iframe: IframeNode }

export default function Canvas() {
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const setNodes = useFlowStore((s) => s.setNodes)
  const setEdges = useFlowStore((s) => s.setEdges)
  const addNode = useFlowStore((s) => s.addNode)
  const addEdgeStore = useFlowStore((s) => s.addEdge)
  const exportJSON = useFlowStore((s) => s.exportJSON)
  const importJSON = useFlowStore((s) => s.importJSON)
  const generateShareLink = useFlowStore((s) => s.generateShareLink)
  const undo = useFlowStore((s) => s.undo)
  const redo = useFlowStore((s) => s.redo)
  const snapshot = useFlowStore((s) => s.snapshot)
  const save = useFlowStore((s) => s.save)
  const showOutline = useFlowStore((s) => s.showOutline)
  const toggleShowOutline = useFlowStore((s) => s.toggleShowOutline)
  const isEditing = useFlowStore((s) => s.isEditing)
  const connectingRef = useRef(false)
  const updateEdge = useFlowStore((s) => s.updateEdge)
  const removeEdge = useFlowStore((s) => s.removeEdge)

  const [edgeMenu, setEdgeMenu] = useState<{ edge: Edge; x: number; y: number } | null>(null)
  const locked = useFlowStore((s) => s.locked)
  const toggleLocked = useFlowStore((s) => s.toggleLocked)
  const setShowDesc = useFlowStore((s) => s.setShowDesc)
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const [lockUsedInFullscreen, setLockUsedInFullscreen] = useState(false)

  // Calculate minZoom so you can never zoom out past fitting all nodes
  const minZoom = useMemo(() => {
    if (nodes.length === 0) return 0.1
    const padding = 100
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const node of nodes) {
      const w = node.data?.width || node.width || 300
      const h = node.data?.height || node.height || 120
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + w)
      maxY = Math.max(maxY, node.position.y + h)
    }
    const contentW = maxX - minX + padding * 2
    const contentH = maxY - minY + padding * 2
    const zoomX = viewportSize.w / contentW
    const zoomY = viewportSize.h / contentH
    // Allow zooming out 30% beyond the fit-all level for breathing room
    return Math.min(zoomX, zoomY, 1) * 0.7
  }, [nodes, viewportSize])

  // Track viewport size for minZoom calculation
  useEffect(() => {
    const el = reactFlowWrapper.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setViewportSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Track fullscreen state
  useEffect(() => {
    const onFs = () => {
      const fs = !!document.fullscreenElement
      setIsFullscreen(fs)
      if (!fs) setLockUsedInFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (locked) return
    event.stopPropagation()
    setEdgeMenu({ edge, x: event.clientX, y: event.clientY })
  }, [locked])

  function handleEdgeUpdate(id: string, patch: Partial<Edge>) {
    updateEdge(id, patch)
    debouncedSave()
  }

  function handleEdgeDelete(id: string) {
    removeEdge(id)
    debouncedSave()
  }

  const saveDebounceRef = useRef<number | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null)
  const rfInstanceRef = useRef<any>(null)
  const clipboardRef = useRef<Node[]>([])

  function debouncedSave(delay = 800) {
    if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = window.setTimeout(() => {
      save()
      saveDebounceRef.current = null
    }, delay)
  }

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev))
    debouncedSave()
  }, [setNodes])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev))
    debouncedSave()
  }, [setEdges])

  const onConnect: OnConnect = useCallback((params: Connection) => {
    if (locked) return
    // Prevent duplicate connections between same source/target/handles
    const existing = useFlowStore.getState().edges
    const isDuplicate = existing.some(e =>
      e.source === params.source &&
      e.target === params.target &&
      (e.sourceHandle || undefined) === (params.sourceHandle || undefined) &&
      (e.targetHandle || undefined) === (params.targetHandle || undefined)
    )
    if (isDuplicate) return

    const id = `e_${Date.now()}`
    const edge = {
      id,
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
      animated: true,
      markerEnd: { type: MarkerType.Arrow }
    }
    addEdgeStore(edge as any)
    debouncedSave()
  }, [addEdgeStore])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    // show copy cursor
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDropHandler = useCallback((event: DragEvent) => {
    event.preventDefault()
    if (locked) return
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    if (!bounds) return

    const clientX = event.clientX
    const clientY = event.clientY
    const position = rfInstanceRef.current?.project({ x: clientX - bounds.left, y: clientY - bounds.top })

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader()
        reader.onload = () => {
          const src = reader.result as string
          const id = `img_${Date.now()}`
          const node = { id, type: 'image', position: position || { x: 0, y: 0 }, data: { src, id } }
          addNode(node as any)
          debouncedSave()
        }
        reader.readAsDataURL(file)
      }
      return
    }

    // fallback: try plain/text or uri-list
    const uri = event.dataTransfer?.getData('text/uri-list') || event.dataTransfer?.getData('text/plain')
    if (uri) {
      const id = `img_${Date.now()}`
      const node = { id, type: 'image', position: position || { x: 0, y: 0 }, data: { src: uri, id } }
      addNode(node as any)
      debouncedSave()
    }
  }, [addNode])

  /** Get the center of the current viewport in flow coordinates */
  function getViewportCenter() {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    const rf = rfInstanceRef.current
    if (bounds && rf) {
      return rf.project({ x: bounds.width / 2, y: bounds.height / 2 })
    }
    return { x: 250, y: 150 }
  }

  function createMarkdownNode() {
    const id = `md_${Date.now()}`
    const center = getViewportCenter()
    const node = {
      id,
      type: 'markdown',
      position: { x: center.x - 150, y: center.y - 60 },
      data: { content: '# New note', id },
      draggable: false,
    }
    addNode(node as any)
  }

  function createIframeNode() {
    const id = `iframe_${Date.now()}`
    const center = getViewportCenter()
    const node = {
      id,
      type: 'iframe',
      position: { x: center.x - 240, y: center.y - 160 },
      data: { url: '', id },
      draggable: false,
    }
    addNode(node as any)
  }

  function createImageNode() {
    const id = `img_${Date.now()}`
    const center = getViewportCenter()
    const node = {
      id,
      type: 'image',
      position: { x: center.x - 110, y: center.y - 80 },
      data: { src: '', id },
      draggable: false,
    }
    addNode(node as any)
  }

  function handleAddMarkdown() {
    console.log('handleAddMarkdown clicked')
    try {
      createMarkdownNode()
    } catch (err) {
      console.error('createMarkdownNode error', err)
      alert('Error creating markdown node — see console')
    }
  }

  function handleAddImage() {
    console.log('handleAddImage clicked')
    try {
      createImageNode()
    } catch (err) {
      console.error('createImageNode error', err)
      alert('Error creating image node — see console')
    }
  }

  function handleAddIframe() {
    try {
      createIframeNode()
    } catch (err) {
      console.error('createIframeNode error', err)
      alert('Error creating iframe node — see console')
    }
  }

  function handleSaveClick() {
    try {
      save()
    } catch (err) {
      console.error('save error', err)
      alert('Error saving — see console')
    }
  }

  function handleExportClick() {
    try {
      exportJSON()
    } catch (err) {
      console.error('exportJSON error', err)
      alert('Error exporting — see console')
    }
  }

  function handleShareClick() {
    try {
      generateShareLink()
    } catch (err) {
      console.error('share error', err)
      alert('Error generating share link — see console')
    }
  }

  function handleImportClick() {
    try {
      importJSON()
    } catch (err) {
      console.error('importJSON error', err)
      alert('Error importing — see console')
    }
  }

  async function handleScreenshot() {
    try {
      // Call the Puppeteer screenshot server
      const response = await fetch('http://localhost:3001/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          scale: 8,
        }),
      });

      if (!response.ok) {
        throw new Error('Screenshot server error');
      }

      const data = await response.json();
      
      if (data.success) {
        // Download the screenshot
        const link = document.createElement('a');
        link.href = `http://localhost:3001/screenshot/${data.filename}`;
        link.download = data.filename;
        link.click();
        alert('Screenshot captured successfully!');
      } else {
        throw new Error(data.error || 'Failed to capture screenshot');
      }
    } catch (err) {
      console.error('screenshot error:', err);
      alert('Make sure the screenshot server is running: node screenshot-server.js');
    }
  }

  // Copy / Paste keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      if (meta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }

      if (meta && e.key === 'c') {
        const selected = useFlowStore.getState().nodes.filter((n) => n.selected)
        if (selected.length > 0) {
          clipboardRef.current = selected.map((n) => JSON.parse(JSON.stringify(n)))
        }
      }

      if (meta && e.key === 'v') {
        const clip = clipboardRef.current
        if (clip.length === 0) return
        e.preventDefault()
        snapshot()
        const now = Date.now()
        // Deselect all current nodes
        setNodes((prev) => prev.map((n) => ({ ...n, selected: false })))
        // Create duplicates offset by 40px
        clip.forEach((orig, i) => {
          const newId = `${orig.type}_${now}_${i}`
          const newNode: any = {
            ...orig,
            id: newId,
            position: { x: orig.position.x + 40, y: orig.position.y + 40 },
            selected: true,
            draggable: false,
            data: { ...orig.data, id: newId },
          }
          addNode(newNode)
        })
        debouncedSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addNode, setNodes, undo, redo])

  useEffect(() => {
    // autosave every 5s
    const interval = window.setInterval(() => {
      save()
    }, 5000)

    const onBeforeUnload = () => {
      // synchronous save attempt before unload
      // Dexie operations are async; at least try to trigger save
      save()
    }

    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current)
    }
  }, [save])

  return (
    <div className="h-screen w-screen relative" onContextMenu={locked ? (e) => e.preventDefault() : undefined}>
      <div className="absolute inset-0" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onConnectStart={() => {
            connectingRef.current = true
            reactFlowWrapper.current?.classList.add('show-all-handles')
          }}
          onConnectEnd={() => {
            connectingRef.current = false
            reactFlowWrapper.current?.classList.remove('show-all-handles')
          }}
          onDragOver={(e: any) => onDragOver(e)}
          onDrop={(e: any) => onDropHandler(e)}
          onInit={(inst) => (rfInstanceRef.current = inst)}
          onMoveStart={() => setShowDesc(false)}
          nodeTypes={nodeTypes}
          fitView
          minZoom={minZoom}
          zoomOnScroll
          panOnDrag={isEditing ? false : locked ? true : [1, 2]}
          selectionOnDrag={!isEditing && !locked}
          selectionMode={'partial' as any}
          multiSelectionKeyCode="Shift"
          nodesDraggable={!locked}
          nodesConnectable={!locked}
          elementsSelectable={!locked}
          edgesFocusable={!locked}
          connectionRadius={40}
          className="absolute inset-0"
          style={{ background: '#4b4b4b' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={'dots' as any} gap={100} size={GRID_DOT_SIZE} color={GRID_DOT_COLOR} />
        </ReactFlow>

        {edgeMenu ? (
          <EdgeContextMenu
            edge={edgeMenu.edge}
            x={edgeMenu.x}
            y={edgeMenu.y}
            onClose={() => setEdgeMenu(null)}
            onUpdate={handleEdgeUpdate}
            onDelete={handleEdgeDelete}
          />
        ) : null}

        <div className="absolute left-4 bottom-4 p-2 bg-transparent pointer-events-auto" style={{ zIndex: 100 }}>
          <div className="flex flex-col gap-2">
          {!locked && (
            <>
              <button onClick={handleAddMarkdown} className="icon-btn" title="Add Markdown">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 4v16" />
                  <path d="M17 4v16" />
                  <path d="M7 9h6" />
                  <path d="M7 15h6" />
                </svg>
              </button>

              <button onClick={handleAddImage} className="icon-btn" title="Add Image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>

              <button onClick={handleAddIframe} className="icon-btn" title="Add Iframe">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 8l-4 4 4 4" />
                  <path d="M17 8l4 4-4 4" />
                  <line x1="14" y1="4" x2="10" y2="20" />
                </svg>
              </button>

              <button onClick={handleSaveClick} className="icon-btn" title="Save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8" />
                </svg>
              </button>

              <button onClick={handleImportClick} className="icon-btn" title="Open JSON">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              <button onClick={handleExportClick} className="icon-btn" title="Export JSON">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 5 17 10" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                </svg>
              </button>

              <button onClick={handleShareClick} className="icon-btn" title="Generate Share Link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>

              <button onClick={() => toggleShowOutline()} className={`icon-btn ${showOutline ? 'bg-white/20' : ''}`} title="Toggle Outline">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="10" height="10" />
                </svg>
              </button>

              <button onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen()
                } else {
                  document.documentElement.requestFullscreen()
                }
              }} className="icon-btn" title="Toggle Fullscreen">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
              </button>

              <div className="w-full h-px bg-white/10 my-1" />
            </>
          )}

          <button onClick={handleScreenshot} className="icon-btn" title="Take Screenshot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          <button onClick={() => rfInstanceRef.current?.zoomIn({ duration: 200 })} className="icon-btn" title="Zoom In">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button onClick={() => rfInstanceRef.current?.zoomOut({ duration: 200 })} className="icon-btn" title="Zoom Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button onClick={() => { rfInstanceRef.current?.fitView({ duration: 300 }); setShowDesc(true) }} className="icon-btn" title="Fit View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>

          {!(isFullscreen && lockUsedInFullscreen) && <button onClick={() => { if (isFullscreen) setLockUsedInFullscreen(true); toggleLocked() }} className={`icon-btn ${locked ? 'bg-white/20' : ''}`} title={locked ? 'Unlock' : 'Lock'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {locked ? (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              ) : (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </>
              )}
            </svg>
          </button>}
        </div>
      </div>
      </div>
    </div>
  )
}
