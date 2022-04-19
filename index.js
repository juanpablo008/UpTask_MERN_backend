import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import userRoutes from "./routes/userRoutes.js"
import projectRoutes from "./routes/projectRoutes.js"
import taskRoutes from "./routes/taskRoutes.js"
import { Server } from "socket.io"


const app = express()
app.use(express.json())

dotenv.config()

connectDB()

// Config CORS
const whitelist = [process.env.FRONTEND_URL]

const corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.includes(origin)) {
      // Can send access control headers
      callback(null, true)
    } else {
      // Cannot send access control headers
      callback(new Error("No permitido por CORS"))
    }
  },
}

app.use(cors(corsOptions))

// Routes
app.use("/api/users", userRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)

const PORT = process.env.PORT || 4000

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// Socket.io
const io = new Server(server, {
  pingInterval: 60000,
  cors: {
    origin: process.env.FRONTEND_URL
  }
})

io.on("connection", socket => {
  // Events socket.io
  socket.on("open project", projectId => socket.join(projectId))
  socket.on('new task', task => socket.to(task.project).emit('added task', task))
  socket.on('delete task', task => socket.to(task.project).emit('deleted task', task))
  socket.on('edit task', task => socket.to(task.project._id).emit('updated task', task))
  socket.on('change task status', task => socket.to(task.project._id).emit('new state', task))
})