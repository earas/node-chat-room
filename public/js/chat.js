const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// valuebles
var counter = 0;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


socket.on('typing', (username) => {
//const v1 = document.querySelector('#sidebar').getElementsByClassName("users").getElementsByTagName("li");
const v2 = document.querySelector('#sidebar').getElementsByTagName("li");
//const v2 = v1.getElementsByClassName()
//console.log(v1)
for(i = 0; i < v2.length; i++){
    if(v2[i].textContent === username){
        const $name = v2[i].textContent
        v2[i].textContent = $name+" typing..."
        break
    }
}
//const name = v2[0].textContent
//v2[0].textContent = name+" typing..."
//console.log(username)
//console.log(v2.length)


})


socket.on('untyping', (username) => {
    const v2 = document.querySelector('#sidebar').getElementsByTagName("li");
    for(i = 0; i < v2.length; i++){
        if(v2[i].textContent === username+" typing..."){
            //const $name = v2[i].textContent
            v2[i].textContent = username
            
            break
        }
    }
    })

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        socket.emit('untyping')
        counter = 0
        //console.log("input length: "+$messageFormInput.value.length)
        //handleInput

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })

    
})

$messageForm.oninput = handleInput

function handleInput(e) {

    /*if(e.target.value.length > 0){
        socket.emit('typing')
    }
    else{
        socket.emit('untyping')
    }*/

    
     if(e.target.value.length > 0){
       if(counter === 0){
            socket.emit('typing')
            counter = 1;
        }           
    }
    else{
        socket.emit('untyping')
        counter = 0
    }
}

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})