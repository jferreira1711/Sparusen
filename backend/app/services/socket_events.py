import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=True,        # ← activa logs detallados
    engineio_logger=True  # ← logs de engine.io
)

rooms: dict = {}

@sio.event
async def connect(sid, environ):
    print(f"[Socket.io] Cliente conectado: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[Socket.io] Cliente desconectado: {sid}")
    for room_id, users in list(rooms.items()):
        if sid in users:
            users.remove(sid)
            await sio.emit("user_left", {"sid": sid}, room=room_id)

@sio.event
async def join_room(sid, data):
    try:
        room_id   = data.get("room_id")
        user_name = data.get("user_name", "Usuario")
        if not room_id:
            return
        sio.enter_room(sid, room_id)
        rooms.setdefault(room_id, []).append(sid)
        await sio.emit("user_joined", {"sid": sid, "name": user_name}, room=room_id)
        print(f"[Socket.io] {user_name} entró a sala {room_id}")
    except Exception as e:
        print(f"[Socket.io] ERROR en join_room: {e}")

@sio.event
async def chat_message(sid, data):
    try:
        room_id = data.get("room_id")
        if room_id:
            await sio.emit("new_message", {
                "sender":  data.get("sender", "Anónimo"),
                "message": data.get("message", ""),
                "sid":     sid
            }, room=room_id, skip_sid=sid)  
    except Exception as e:
        print(f"[Socket.io] ERROR en chat_message: {e}")

@sio.event
async def webrtc_signal(sid, data):
    try:
        target = data.get("target_sid")
        if target:
            await sio.emit("webrtc_signal", {
                "signal":   data.get("signal"),
                "from_sid": sid
            }, to=target)
    except Exception as e:
        print(f"[Socket.io] ERROR en webrtc_signal: {e}")

@sio.event
async def whiteboard_update(sid, data):
    try:
        room_id = data.get("room_id")
        if room_id:
            await sio.emit("whiteboard_action",
                data.get("action"),
                room=room_id,
                skip_sid=sid)
    except Exception as e:
        print(f"[Socket.io] ERROR en whiteboard_update: {e}")