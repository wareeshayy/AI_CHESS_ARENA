import type { Server, Socket } from "socket.io"
import {
  joinRoom,
  leaveRoom,
  makeMove,
  getRoom,
  createRoom,
} from "./room-service"

export function setupSocketIO(io: Server): void {
  io.on("connection", (socket: Socket) => {
    let currentRoom: string | null = null
    let playerId: string | null = null

    socket.on("create-room", async (ack?: (data: unknown) => void) => {
      const room = await createRoom()
      if (typeof ack === "function") ack({ ok: true, room })
    })

    socket.on(
      "join-room",
      async (
        data: { roomId: string; playerId: string },
        ack?: (data: unknown) => void,
      ) => {
        playerId = data.playerId
        currentRoom = data.roomId.toLowerCase()
        const result = await joinRoom(currentRoom, playerId)

        if (!result.ok) {
          if (typeof ack === "function") ack(result)
          return
        }

        socket.join(currentRoom)
        io.to(currentRoom).emit("room-update", result.room)

        if (typeof ack === "function") ack(result)
      },
    )

    socket.on(
      "move",
      async (
        data: { roomId: string; playerId: string; from: string; to: string; promotion?: string },
        ack?: (data: unknown) => void,
      ) => {
        const result = await makeMove(data.roomId, data.playerId, data.from, data.to, data.promotion)
        if (result.ok && result.room) {
          io.to(result.room.roomId).emit("room-update", result.room)
        }
        if (typeof ack === "function") ack(result)
      },
    )

    socket.on("get-room", async (data: { roomId: string }, ack?: (data: unknown) => void) => {
      const room = await getRoom(data.roomId)
      if (typeof ack === "function") ack({ room })
    })

    socket.on("disconnect", async () => {
      if (currentRoom && playerId) {
        const room = await leaveRoom(currentRoom, playerId)
        if (room) io.to(currentRoom).emit("room-update", room)
      }
    })
  })
}
