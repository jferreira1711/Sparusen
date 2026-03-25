import { useRef, useEffect, useState, useCallback } from "react"
import { socket, sendWhiteboardAction } from "../services/socket"

const COLORS = [
    "#1a1a1a", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
    "#ffffff", "#94a3b8"
]

export default function Whiteboard({ roomId, readOnly = false }) {

    const canvasRef  = useRef(null)
    const drawing    = useRef(false)
    const lastPos    = useRef({ x: 0, y: 0 })
    const history    = useRef([])
    const redoStack  = useRef([])

    const [tool,      setTool]      = useState("pen")
    const [color,     setColor]     = useState("#1a1a1a")
    const [size,      setSize]      = useState(3)
    const [showGrid,  setShowGrid]  = useState(true)

    // ── Dibujar cuadrícula ─────────────────────────────────
    const drawGrid = useCallback((ctx, width, height) => {
        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth   = 0.5
        const step = 30
        for (let x = 0; x <= width; x += step) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, height)
            ctx.stroke()
        }
        for (let y = 0; y <= height; y += step) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
        }
    }, [])

    // ── Guardar estado en historial ────────────────────────
    const saveHistory = useCallback(() => {
        const canvas = canvasRef.current
        history.current.push(canvas.toDataURL())
        redoStack.current = []
    }, [])

    // ── Restaurar grid después de deshacer ─────────────────
    const restoreCanvas = useCallback((dataUrl) => {
        const canvas = canvasRef.current
        const ctx    = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (showGrid) drawGrid(ctx, canvas.width, canvas.height)
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = dataUrl
    }, [showGrid, drawGrid])

    // ── Recibir acciones del otro usuario ──────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx    = canvas.getContext("2d")

        if (showGrid) drawGrid(ctx, canvas.width, canvas.height)

        socket.on("whiteboard_action", (action) => {
            if (action.type === "draw") {
                ctx.beginPath()
                ctx.moveTo(action.x0, action.y0)
                ctx.lineTo(action.x1, action.y1)
                ctx.strokeStyle = action.color
                ctx.lineWidth   = action.size
                ctx.lineCap     = "round"
                ctx.lineJoin    = "round"
                ctx.stroke()
            } else if (action.type === "clear") {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                if (showGrid) drawGrid(ctx, canvas.width, canvas.height)
            }
        })

        return () => socket.off("whiteboard_action")
    }, [showGrid, drawGrid])

    // ── Obtener posición del mouse ─────────────────────────
    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const scaleX = canvasRef.current.width / rect.width
        const scaleY = canvasRef.current.height / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top)  * scaleY
        }
    }

    const onMouseDown = (e) => {
        if (readOnly) return
        saveHistory()
        drawing.current = true
        lastPos.current = getPos(e)
    }

    const onMouseMove = (e) => {
        if (!drawing.current || readOnly) return

        const canvas    = canvasRef.current
        const ctx       = canvas.getContext("2d")
        const pos       = getPos(e)
        const drawColor = tool === "eraser" ? "#ffffff" : color
        const drawSize  = tool === "eraser" ? size * 6 : size

        ctx.beginPath()
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.strokeStyle = drawColor
        ctx.lineWidth   = drawSize
        ctx.lineCap     = "round"
        ctx.lineJoin    = "round"
        ctx.stroke()

        sendWhiteboardAction(roomId, {
            type:  "draw",
            x0:    lastPos.current.x,
            y0:    lastPos.current.y,
            x1:    pos.x,
            y1:    pos.y,
            color: drawColor,
            size:  drawSize
        })

        lastPos.current = pos
    }

    const onMouseUp = () => { drawing.current = false }

    // ── Deshacer ───────────────────────────────────────────
    const undo = () => {
        if (history.current.length === 0) return
        const last = history.current.pop()
        redoStack.current.push(canvasRef.current.toDataURL())
        restoreCanvas(last)
    }

    // ── Rehacer ────────────────────────────────────────────
    const redo = () => {
        if (redoStack.current.length === 0) return
        const next = redoStack.current.pop()
        history.current.push(canvasRef.current.toDataURL())
        restoreCanvas(next)
    }

    // ── Limpiar ────────────────────────────────────────────
    const clearCanvas = () => {
        saveHistory()
        const canvas = canvasRef.current
        const ctx    = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (showGrid) drawGrid(ctx, canvas.width, canvas.height)
        sendWhiteboardAction(roomId, { type: "clear" })
    }

    // ── Teclado shortcuts ──────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (e.ctrlKey && e.key === "z") undo()
            if (e.ctrlKey && e.key === "y") redo()
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [])

    const tools = [
        { id: "pen",     icon: "✏️",  label: "Lápiz (P)" },
        { id: "eraser",  icon: "🧹",  label: "Borrador (E)" },
    ]

    return (
        <div className="flex flex-col h-full bg-white">

            {/* TOOLBAR */}
            {!readOnly ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 flex-wrap">

                    {/* Herramientas */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {tools.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTool(t.id)}
                                title={t.label}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all ${
                                    tool === t.id
                                    ? "bg-white shadow-sm text-purple-600"
                                    : "text-gray-500 hover:bg-white/60"
                                }`}
                            >
                                {t.icon}
                            </button>
                        ))}
                    </div>

                    {/* Separador */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Colores */}
                    <div className="flex gap-1 flex-wrap">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool("pen") }}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                    color === c && tool === "pen"
                                    ? "border-purple-500 scale-110"
                                    : "border-transparent"
                                }`}
                                style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #e2e8f0" : "none" }}
                                title={c}
                            />
                        ))}
                        {/* Color personalizado */}
                        <div className="relative">
                            <input
                                type="color"
                                value={color}
                                onChange={e => { setColor(e.target.value); setTool("pen") }}
                                className="w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer opacity-0 absolute inset-0"
                            />
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400">
                                +
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Tamaño */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Tamaño</span>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={size}
                            onChange={e => setSize(Number(e.target.value))}
                            className="w-20 accent-purple-600"
                        />
                        <div
                            className="rounded-full bg-gray-800 flex-shrink-0"
                            style={{
                                width:  Math.max(4, Math.min(size, 20)),
                                height: Math.max(4, Math.min(size, 20))
                            }}
                        />
                    </div>

                    {/* Separador */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Acciones */}
                    <div className="flex gap-1 ml-auto">
                        <button
                            onClick={undo}
                            disabled={history.current.length === 0}
                            title="Deshacer (Ctrl+Z)"
                            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm"
                        >
                            ↩️
                        </button>
                        <button
                            onClick={redo}
                            disabled={redoStack.current.length === 0}
                            title="Rehacer (Ctrl+Y)"
                            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm"
                        >
                            ↪️
                        </button>
                        <button
                            onClick={() => setShowGrid(g => !g)}
                            title="Mostrar/ocultar cuadrícula"
                            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                                showGrid
                                ? "bg-purple-100 text-purple-600"
                                : "text-gray-400 hover:bg-gray-100"
                            }`}
                        >
                            ⊞
                        </button>
                        <button
                            onClick={clearCanvas}
                            title="Limpiar pizarra"
                            className="w-8 h-8 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors text-sm"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs text-gray-400">
                        👀 Modo observador — solo el profesor puede dibujar
                    </span>
                </div>
            )}

            {/* CANVAS */}
            <div className="flex-1 overflow-hidden relative">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    className="w-full h-full"
                    style={{ cursor: readOnly ? "default" : tool === "eraser" ? "cell" : "crosshair" }}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                />
            </div>
        </div>
    )
}
