import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io'

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.static('public'));

const server = createServer(app)
const io = new Server(server);

const rooms = {}

app.get('/:name/users', (req, res) => {
    const name = req.params.name
    if (rooms[name]) {
        res.json(rooms[name].clients)
    } else {
        res.json({})
    }
})

// Lorsque que quelqu'un se connecte
io.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.emit('rooms', Object.keys(rooms))

    socket.on('join', ({ name, username }) => {
        if (!rooms[name]) {
            rooms[name] = {
                clients: {},
                messages: []
            }
        }

        // Rejoins le salon
        const room = rooms[name]
        room.clients[username] = socket

        // Envoie l'historique des messages
        for (const message of room.messages) {
            socket.emit("message", message)
        }

        // Envoie une notif aux autres
        const notif = {
            author: "INFO",
            text: `<i/>${username} a rejoint le salon<i>`,
            date: new Date()
        }
        room.messages.push(notif)
        for (const clientName in room.clients) {
            const clientSocket = room.clients[clientName]
            clientSocket.emit("message", notif)
        }
    });

    socket.on('message', ({ name, username, text }) => {
        if (rooms[name]) {
            const room = rooms[name]
            const message = {
                author: username,
                text,
                date: new Date()
            }
            rooms[name].messages.push(message)

            for (const clientname in room.clients) {
                const clientSocket = room.clients[clientname]
                clientSocket.emit("message", message)
            }
        }
    });

    socket.on('disconnect', () => {
        // Quitte tous les salons
        let username
        for (const name in rooms) {
            const room = rooms[name]
            for (const clientName in room.clients) {
                const clientSocket = room.clients[clientName]
                if (clientSocket == socket) {
                    // Supprime du tableau des clients du salon
                    username = clientName
                    delete room.clients[clientName]
                }
            }
            for (const clientName in room.clients) {
                // Envoie une notif aux autres
                const clientSocket = room.clients[clientName]
                clientSocket.emit("message", {
                    author: "INFO",
                    text: `<i/>${username} a quitté le salon<i>`,
                    date: new Date()
                })
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});