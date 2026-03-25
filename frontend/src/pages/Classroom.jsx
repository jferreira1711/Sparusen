import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { socket, joinRoom, sendChatMessage } from "../services/socket"
import { joinClass, endClass } from "../services/api"
import { useAuth } from "../context/AuthContext"
import Whiteboard from "../components/Whiteboard"

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        {
            urls:       "turn:openrelay.metered.ca:80",
            username:   "openrelayproject",
            credential: "openrelayproject"
        },
        {
            urls:       "turn:openrelay.metered.ca:443",
            username:   "openrelayproject",
            credential: "openrelayproject"
        }
    ]
}

export default function Classroom() {

    const { id }   = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    // ── REFS ───────────────────────────────────────────────
    const localVideoRef    = useRef(null)
    const remoteVideoRef   = useRef(null)
    const pcRef            = useRef(null)  // RTCPeerConnection nativo
    const localStreamRef   = useRef(null)
    const screenStreamRef  = useRef(null)
    const chatEndRef       = useRef(null)
    const remoteSidRef     = useRef(null)

    // ── ESTADO ─────────────────────────────────────────────
    const [classData,     setClassData]     = useState(null)
    const [messages,      setMessages]      = useState([])
    const [chatInput,     setChatInput]     = useState("")
    const [connected,     setConnected]     = useState(false)
    const [camOn,         setCamOn]         = useState(true)
    const [micOn,         setMicOn]         = useState(true)
    const [showBoard,     setShowBoard]     = useState(false)
    const [isSharing,     setIsSharing]     = useState(false)
    const [remoteSharing, setRemoteSharing] = useState(false)

    // ── Auto scroll chat ───────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── Crear RTCPeerConnection ────────────────────────────
    const createPC = useCallback(() => {
        // Cerrar conexión anterior
        if (pcRef.current) {
            pcRef.current.close()
            pcRef.current = null
        }

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc

        // Cuando recibimos ICE candidates los enviamos al otro
        pc.onicecandidate = (event) => {
            if (event.candidate && remoteSidRef.current) {
                socket.emit("webrtc_signal", {
                    room_id:    id,
                    signal:     { type: "candidate", candidate: event.candidate },
                    target_sid: remoteSidRef.current
                })
            }
        }

        // Cuando el estado de conexión cambia
        pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState)
            if (pc.connectionState === "connected") {
                setConnected(true)
            } else if (
                pc.connectionState === "disconnected" ||
                pc.connectionState === "failed" ||
                pc.connectionState === "closed"
            ) {
                setConnected(false)
            }
        }

        // Cuando recibimos el stream remoto
        pc.ontrack = (event) => {
            console.log("Track remoto recibido:", event.track.kind)
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0]
                setConnected(true)
            }
        }

        return pc
    }, [id])

    // ── Agregar tracks locales al PC ───────────────────────
    const addLocalTracks = useCallback((pc, stream) => {
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream)
        })
    }, [])

    // ── Crear y enviar OFFER ───────────────────────────────
    const createOffer = useCallback(async (targetSid) => {
        const pc = createPC()
        addLocalTracks(pc, localStreamRef.current)

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        socket.emit("webrtc_signal", {
            room_id:    id,
            signal:     { type: "offer", sdp: pc.localDescription },
            target_sid: targetSid
        })
    }, [id, createPC, addLocalTracks])

    // ── Procesar señal WebRTC recibida ─────────────────────
    const handleSignal = useCallback(async (signal, fromSid) => {
        remoteSidRef.current = fromSid

        if (signal.type === "offer") {
            // Recibí una oferta → crear PC y responder
            const pc = createPC()
            addLocalTracks(pc, localStreamRef.current)

            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            socket.emit("webrtc_signal", {
                room_id:    id,
                signal:     { type: "answer", sdp: pc.localDescription },
                target_sid: fromSid
            })

        } else if (signal.type === "answer") {
            // Recibí respuesta a mi oferta
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                )
            }

        } else if (signal.type === "candidate") {
            // Recibí un ICE candidate
            if (pcRef.current && signal.candidate) {
                try {
                    await pcRef.current.addIceCandidate(
                        new RTCIceCandidate(signal.candidate)
                    )
                } catch(e) {
                    console.error("Error ICE candidate:", e)
                }
            }
        }
    }, [id, createPC, addLocalTracks])

    // ── Inicializar aula ───────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const res = await joinClass(id)
                setClassData(res.data)

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                })
                localStreamRef.current = stream

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }

                joinRoom(id, user?.nombre || "Usuario")

                // Limpiar listeners
                socket.off("user_joined")
                socket.off("webrtc_signal")
                socket.off("new_message")
                socket.off("user_left")
                socket.off("screen_sharing_started")
                socket.off("screen_sharing_stopped")

                // Cuando el otro entra → yo inicio la oferta
                socket.on("user_joined", ({ sid, name }) => {
                    if (sid === socket.id) return
                    remoteSidRef.current = sid
                    addSystemMessage(`${name} se unió a la clase`)
                    createOffer(sid)
                })

                // Recibir señales WebRTC
                socket.on("webrtc_signal", ({ signal, from_sid }) => {
                    handleSignal(signal, from_sid)
                })

                socket.on("new_message", (msg) => {
                    setMessages(m => [...m, {
                        type:   "message",
                        sender: msg.sender,
                        text:   msg.message,
                        self:   false,
                        time:   new Date().toLocaleTimeString([], {
                            hour: "2-digit", minute: "2-digit"
                        })
                    }])
                })

                socket.on("user_left", () => {
                    addSystemMessage("El otro participante abandonó la clase")
                    setConnected(false)
                    setRemoteSharing(false)
                    remoteSidRef.current = null
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null
                    }
                    if (pcRef.current) {
                        pcRef.current.close()
                        pcRef.current = null
                    }
                })

                socket.on("screen_sharing_started", ({ name }) => {
                    setRemoteSharing(true)
                    addSystemMessage(`${name} está compartiendo su pantalla`)
                })

                socket.on("screen_sharing_stopped", ({ name }) => {
                    setRemoteSharing(false)
                    addSystemMessage(`${name} dejó de compartir pantalla`)
                })

            } catch(err) {
                console.error("Error al iniciar aula:", err)
                alert("No se pudo acceder a la cámara/micrófono.")
            }
        }

        init()

        return () => {
            socket.off("user_joined")
            socket.off("webrtc_signal")
            socket.off("new_message")
            socket.off("user_left")
            socket.off("screen_sharing_started")
            socket.off("screen_sharing_stopped")
            socket.disconnect()
            localStreamRef.current?.getTracks().forEach(t => t.stop())
            screenStreamRef.current?.getTracks().forEach(t => t.stop())
            pcRef.current?.close()
        }
    }, [id, createOffer, handleSignal])

    // ── COMPARTIR PANTALLA ─────────────────────────────────
    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            })
            screenStreamRef.current = screenStream

            const screenTrack = screenStream.getVideoTracks()[0]

            // Reemplazar track de video en el PC
            if (pcRef.current) {
                const sender = pcRef.current
                    .getSenders()
                    .find(s => s.track?.kind === "video")

                if (sender) {
                    await sender.replaceTrack(screenTrack)
                    console.log("Pantalla compartida via replaceTrack")
                }
            }

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream
            }

            setIsSharing(true)

            socket.emit("screen_sharing_started", {
                room_id: id,
                name:    user?.nombre || "Usuario"
            })

            screenTrack.onended = () => stopScreenShare()

        } catch(err) {
            if (err.name !== "NotAllowedError") {
                console.error("Error pantalla:", err)
            }
        }
    }

    const stopScreenShare = async () => {
        try {
            const cameraTrack = localStreamRef.current?.getVideoTracks()[0]

            if (pcRef.current && cameraTrack) {
                const sender = pcRef.current
                    .getSenders()
                    .find(s => s.track?.kind === "video")

                if (sender) {
                    await sender.replaceTrack(cameraTrack)
                }
            }

            screenStreamRef.current?.getTracks().forEach(t => t.stop())
            screenStreamRef.current = null

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current
            }

            setIsSharing(false)

            socket.emit("screen_sharing_stopped", {
                room_id: id,
                name:    user?.nombre || "Usuario"
            })

        } catch(err) {
            console.error("Error detener pantalla:", err)
            setIsSharing(false)
        }
    }

    // ── CONTROLES ──────────────────────────────────────────
    const toggleCam = () => {
        localStreamRef.current?.getVideoTracks().forEach(t => {
            t.enabled = !t.enabled
        })
        setCamOn(c => !c)
    }

    const toggleMic = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => {
            t.enabled = !t.enabled
        })
        setMicOn(m => !m)
    }

    const handleSendChat = (e) => {
        e.preventDefault()
        if (!chatInput.trim()) return
        setMessages(m => [...m, {
            type:   "message",
            sender: user?.nombre || "Yo",
            text:   chatInput,
            self:   true,
            time:   new Date().toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit"
            })
        }])
        sendChatMessage(id, chatInput, user?.nombre || "Yo")
        setChatInput("")
    }

    const handleEndClass = async () => {
        if (isSharing) await stopScreenShare()
        if (user?.rol === "teacher") await endClass(id)
        navigate("/clases")
    }

    const addSystemMessage = (text) => {
        setMessages(m => [...m, {
            type: "system",
            text,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit"
            })
        }])
    }

    return (
        <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">

            {/* TOPBAR */}
            <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-5 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white font-semibold text-sm">
                        {classData?.tema_clase || "Aula Virtual"}
                    </span>
                    {remoteSharing && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            📺 Pantalla compartida
                        </span>
                    )}
                    {isSharing && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            🖥️ Compartiendo
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
                        connected
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            connected ? "bg-green-400" : "bg-yellow-400 animate-pulse"
                        }`} />
                        {connected ? "Conectado" : "Esperando..."}
                    </div>
                    <button
                        onClick={handleEndClass}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        {user?.rol === "teacher" ? "Finalizar" : "Salir"}
                    </button>
                </div>
            </div>

            {/* ÁREA PRINCIPAL */}
            <div className="flex flex-1 overflow-hidden">

                {/* VIDEO */}
                <div className="flex-1 relative flex flex-col bg-gray-950">
                    <div className="flex-1 relative bg-black">

                        {/* Video remoto grande */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-contain"
                        />

                        {/* Placeholder */}
                        {!connected && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10">
                                <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center mb-5 animate-pulse">
                                    <span className="text-5xl">👤</span>
                                </div>
                                <p className="text-gray-300 font-semibold text-lg">
                                    Esperando al otro participante...
                                </p>
                                <p className="text-gray-600 text-sm mt-2">
                                    Ambos deben estar en la misma URL
                                </p>
                                <div className="flex gap-1 mt-4">
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
                                </div>
                            </div>
                        )}

                        {remoteSharing && connected && (
                            <div className="absolute top-4 left-4 z-20">
                                <span className="text-white text-xs bg-blue-600/80 backdrop-blur-sm px-3 py-1.5 rounded-lg font-medium">
                                    📺 Viendo pantalla compartida
                                </span>
                            </div>
                        )}

                        {connected && !remoteSharing && (
                            <div className="absolute bottom-4 left-4 z-20">
                                <span className="text-white text-sm bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                    👤 Participante
                                </span>
                            </div>
                        )}

                        {/* Video local pequeño overlay */}
                        <div className="absolute bottom-4 right-4 z-20 w-48 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900">
                            <video
                                ref={localVideoRef}
                                autoPlay playsInline muted
                                className="w-full h-full object-cover"
                            />
                            {!camOn && !isSharing && (
                                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                    <span className="text-3xl">👤</span>
                                </div>
                            )}
                            {isSharing && (
                                <div className="absolute top-2 left-2">
                                    <span className="text-white text-xs bg-green-600 px-1.5 py-0.5 rounded">
                                        🖥️
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-1.5 left-2">
                                <span className="text-white text-xs bg-black/70 px-2 py-0.5 rounded-full">
                                    Tú
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pizarra */}
                    {showBoard && (
                        <div className="h-96 border-t border-gray-800">
                            <Whiteboard roomId={id} readOnly={false} />
                        </div>
                    )}

                    {/* Controles */}
                    <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-3 flex-shrink-0">
                        <button
                            onClick={toggleMic}
                            title={micOn ? "Silenciar" : "Activar micrófono"}
                            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center text-xl ${
                                micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                            } text-white`}
                        >
                            {micOn ? "🎤" : "🔇"}
                        </button>
                        <button
                            onClick={toggleCam}
                            disabled={isSharing}
                            title={camOn ? "Apagar cámara" : "Encender cámara"}
                            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center text-xl ${
                                camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
                            } text-white disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {camOn ? "📹" : "🚫"}
                        </button>
                        <button
                            onClick={isSharing ? stopScreenShare : startScreenShare}
                            disabled={!connected}
                            title={!connected ? "Espera conexión" : isSharing ? "Dejar de compartir" : "Compartir pantalla"}
                            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center text-xl ${
                                isSharing
                                ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400/50"
                                : "bg-gray-700 hover:bg-gray-600"
                            } text-white disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {isSharing ? "🖥️" : "📺"}
                        </button>
                        <button
                            onClick={() => setShowBoard(b => !b)}
                            title="Pizarra colaborativa"
                            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center text-xl ${
                                showBoard ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-700 hover:bg-gray-600"
                            } text-white`}
                        >
                            ✏️
                        </button>
                        <div className="w-px h-8 bg-gray-700" />
                        <button
                            onClick={handleEndClass}
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            📴 {user?.rol === "teacher" ? "Finalizar clase" : "Salir"}
                        </button>
                    </div>
                </div>

                {/* CHAT */}
                <div className="w-80 bg-gray-900 flex flex-col border-l border-gray-800 flex-shrink-0">
                    <div className="h-12 flex items-center px-4 border-b border-gray-800">
                        <span className="text-white font-medium text-sm">💬 Chat</span>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                            {messages.filter(m => m.type === "message").length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="text-4xl mb-3">💬</span>
                                <p className="text-gray-500 text-sm">No hay mensajes aún</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            msg.type === "system" ? (
                                <div key={i} className="flex justify-center">
                                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                                        {msg.text}
                                    </span>
                                </div>
                            ) : (
                                <div key={i} className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}>
                                    <span className="text-xs text-gray-500 mb-1 px-1">
                                        {msg.self ? "Tú" : msg.sender} · {msg.time}
                                    </span>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                                        msg.self
                                        ? "bg-purple-600 text-white rounded-br-sm"
                                        : "bg-gray-700 text-gray-100 rounded-bl-sm"
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            )
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-gray-800">
                        <form onSubmit={handleSendChat} className="flex gap-2">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 border border-gray-700"
                                placeholder="Escribe un mensaje..."
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
