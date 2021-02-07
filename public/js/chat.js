const socket = io()

const $messageForm = document.querySelector("#message-form")
const $messageFormButton = document.querySelector(".submitMessage")
const $messageFormInput = document.querySelector("input")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

//Functions
const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

//Socket Emits
socket.emit("join" , {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = "/"
    }
})

//Socket Events
socket.on("message" , (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate , {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML("beforeend" , html)
    autoscroll()
})

socket.on("locationMessage" , (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm A")
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })

    $sidebar.innerHTML = html
})





//Event Listeners
$messageForm.addEventListener("submit" , (e) => {
    e.preventDefault()
    //disable button
    $messageFormButton.setAttribute("disabled" , "disabled")
    $messageFormButton.style.cursor = "not-allowed"

    const message = e.target.elements.message.value
    socket.emit("sendMessage", message , (error) => {
        //Enable button
        $messageFormButton.removeAttribute("disabled")
        $messageFormButton.style.cursor = "pointer"
        $messageFormInput.value = ""
        $messageFormInput.focus()
        
        if(error){
            return console.log(error);
        }

        console.log("Message Delivered");
    });
})


$sendLocationButton.addEventListener("click" , () => {

    if(!navigator.geolocation){
        return alert("This browser does not support location services")
    }

    $sendLocationButton.setAttribute("disabled" , "disabled")
    $sendLocationButton.style.cursor = "not-allowed"

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit("sendLocation" , {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {

            $sendLocationButton.removeAttribute("disabled")
            $sendLocationButton.style.cursor = "pointer"
            console.log("Location sent Successfully");
        })
    })
})


