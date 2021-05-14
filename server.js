const express = require("express")
const socketio = require("socket.io")
const cors = require("cors")
const http = require("http")
const PORT = process.env.PORT || 5000
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const router = require("./router")
app.use(cors())
app.use(router)

const users = []

const addUser = ({id, name, room}) => {
  name = name.trim().toLowerCase()
  room = room.trim().toLowerCase()
  const existinguser = users.find((user) => user.room === room && user.name === name)

  if(existinguser){
    return {error: "Username is taken"}
  }
  const user = {id, name, room}
  users.push(user)
  console.log(users)
  return {user}
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1){
    return users.splice(index,1)[0]
  }

}
const getUser = (id) => {
  return users.find((user) => user.id === id)
}
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room)

}


io.on("connect", (socket) =>{
  console.log("New Connection")
  socket.on("join", ({name, room}, callback) => {
    const {error, user} = addUser({id:socket.id, name:name, room:room})
    if(error) return callback(error)
    socket.emit("message", {user:"admin", text: `Welcome to the room ${user.room}`})
    socket.broadcast.to(user.room).emit("message", {user:"admin", text: `${user.name} has joined`})
    socket.join(user.room)
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    console.log(getUsersInRoom(user.room))
    callback()
  })
  socket.on("sendmessage", (message, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit("message", {user:user.name, text:message})
    callback()
  })
  socket.on("disconnect", () => {
    const user = getUser(socket.id)
    socket.broadcast.to(user.room).emit("message", {user:"admin", text: `${user.name} has left`})
  })
})

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`)
})
