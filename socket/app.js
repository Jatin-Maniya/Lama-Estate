import {Server} from "socket.io"

const io = new Server({
    cors:{
        origin: "http://localhost:5173", // only our application can access this server
    }
})

let onlineUser = []

const addUser = (userId,socketId) => {
    const userExist = onlineUser.find((user)=> user.userId === userId)

    if(!userExist) {
        onlineUser.push({userId,socketId});
    }
}

const removeUser = (socketId) => {
    onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
} 

const getUser = (userId) => {
    return onlineUser.find((user)=>user.userId === userId);
}

io.on("connection",(socket)=>{
   socket.on("newUser",(userId)=>{
    addUser(userId,socket.id)
        io.emit("onlineUsers", onlineUser.map((user) => user.userId));
   })

   socket.on("sendMessage",({receiverId,data}) => {
    const receiver = getUser(receiverId);
        if (receiver?.socketId) {
            io.to(receiver.socketId).emit("getMessage",data);
        }
   })

   socket.on("disconnect",()=>{
    removeUser(socket.id);
        io.emit("onlineUsers", onlineUser.map((user) => user.userId));
   })
})

io.listen("4000")