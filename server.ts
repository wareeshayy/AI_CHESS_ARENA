import { createServer } from "node:http"
import { parse } from "node:url"
import next from "next"
import { Server } from "socket.io"
import { setupSocketIO } from "./src/lib/multiplayer/socket-server"

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME ?? "localhost"
const port = parseInt(process.env.PORT ?? "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: { origin: "*" },
  })

  setupSocketIO(io)

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (Socket.io enabled)`)
  })
})
