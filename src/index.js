const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")
const {generateMessage, generateLocationMessage} = require("./utils/messages")
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const PORT = 3000 || process.env.PORT
const publicDirectory = path.join(__dirname , "../public")

app.use(express.static(publicDirectory))

let count = 0;

io.on("connection", (socket) => {

    //socket.emit ==> Sends to the particular user
    //io.emit ==> Sends to every joined user
    //socket.broadcast.emit ==> Send to every joined user excluding the socket(currentUser)

    //io.to(room).emit ==> Emits an event to every user in a specific room
    //socket.broadcast.to(room).emit ==> Emits an event to every user except the socket(currentUser) in a specific room

    //joining rooms
    socket.on("join", (options, callback) => {
        const {error, user} = addUser({ id: socket.id, ...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room)  // joins the specific room
        socket.emit("message" , generateMessage("Admin",`Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin",`${user.username} has joined`))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })


    socket.on("sendMessage" , (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback("Profanity is not allowed")
        }
        io.to(user.room).emit("message" , generateMessage(user.username, message))
        callback()
    })

    socket.on("disconnect" , () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message" , generateMessage("Admin",`${user.username} has left`))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }     
    })
    
    socket.on("sendLocation" , (position , callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit("locationMessage" , generateLocationMessage(user.username, `https://google.com/maps?q=${position.lat},${position.long}`))
        callback()
    })
})

server.listen(PORT , () => {
    console.log(`Server is up on port ${PORT}`)
})