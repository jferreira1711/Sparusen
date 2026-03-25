import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:8000"

export const socket = io(SOCKET_URL, {
    transports:  ["websocket"],
    autoConnect: false,
})

// ── FUNCIONES AUXILIARES ──────────────────────────────────────

export const joinRoom = (roomId, userName) => {
    // Si ya está conectado emite directamente
    if (socket.connected) {
        socket.emit("join_room", {
            room_id:   roomId,
            user_name: userName
        })
    } else {
        // Espera a que conecte ANTES de emitir join_room
        socket.connect()
        socket.once("connect", () => {
            socket.emit("join_room", {
                room_id:   roomId,
                user_name: userName
            })
        })
    }
}

export const sendChatMessage = (roomId, message, sender) => {
    socket.emit("chat_message", {
        room_id: roomId,
        message,
        sender
    })
}

export const sendWhiteboardAction = (roomId, action) => {
    socket.emit("whiteboard_update", {
        room_id: roomId,
        action
    })
}

export const sendWebRTCSignal = (roomId, signal, targetSid) => {
    socket.emit("webrtc_signal", {
        room_id:    roomId,
        signal,
        target_sid: targetSid
    })
}