let USERNAME
let CURRENT_ROOM
while (!USERNAME) {
    USERNAME = prompt('Qui es tu ?')
}

const input = document.querySelector("#input")
const roomList = document.querySelector("#rooms")
const currentRoom = document.querySelector("#currentRoom")
const currentName = document.querySelector("#currentName")
const notifications = document.querySelector("#notifications")
const socket = io();

socket.on('rooms', updateRoomList)
socket.on("message", addMessage)

function updateRoomList(rooms) {
    for (const room of rooms) {
        const template = document.querySelector("#room")
        const clone = document.importNode(template.content, true)
        clone.id = `${room}-item`
        clone.querySelector('#name').innerHTML = room
        clone.querySelector('#selector').value = room
        clone.querySelector('#getUsers').onclick = () => displayUsers(room)
        roomList.append(clone)
    }
}

async function displayUsers(room) {
    const resp = await fetch(`/${room}/users`)
    const users = await resp.json()
    const roomList = document.querySelector(`#${room}-item`)
    const userList = roomList.querySelector('#users')
    for (const user in users) {
        const userItem = document.createElement('div')
        userList.append(userItem)
    }
}

function addMessage(data) {
    const template = document.querySelector("#message")
    const clone = document.importNode(template.content, true)
    clone.querySelector('#avatar').data = "/assets/images/" + data.author + ".webp"
    clone.querySelector('#author').innerHTML = data.author
    clone.querySelector('#date').innerHTML = data.date.toLocaleString()
    clone.querySelector('#text').innerHTML = data.text
    if (data.author == "INFO") {
        clone.querySelector('.message').classList.add('info')
        notifications.appendChild(clone)
    } else {
        if (data.author == USERNAME) {
            clone.querySelector('.message').classList.add('mine')
        }
        currentRoom.appendChild(clone)
    }
}

function changeRoom(eventOrName) {
    if (typeof eventOrName == 'string') {
        CURRENT_ROOM = eventOrName
    } else {
        CURRENT_ROOM = event.target.value
    }
    notifications.innerHTML = ""
    currentRoom.innerHTML = ""
    currentName.innerHTML = CURRENT_ROOM
    socket.emit('join', {
        name: CURRENT_ROOM,
        username: USERNAME
    })
}

function newRoom() {
    let name
    while (!name) {
        name = prompt('Quel nom pour la discussion ?')
    }
    changeRoom(name)
}

function send() {
    socket.emit("message", {
        name: CURRENT_ROOM,
        username: USERNAME,
        text: input.value
    })
    input.value = ""
}

function resizeTextarea(ta) {
    ta.style.height = "0";
    ta.style.height = ta.scrollHeight + 'px'
}

function keypress(e) {
    if (e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
    }
}