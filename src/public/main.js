const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const roomContainer = document.getElementById('room-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');

if (messageForm != null) {
	const name = prompt('What is your name?');
	appendMessage('You joined', Date.now());
	socket.emit('new-user', roomName, name);
	console.log(roomName, name);

	messageForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const message = messageInput.value;
		appendMessage(`You: ${message}`, Date.now());
		socket.emit('send-chat-message', roomName, message);
		messageInput.value = '';
	});
}

socket.on('room-created', (room) => {
	const roomElement = document.createElement('div');
	roomElement.innerText = room;
	const roomLink = document.createElement('a');
	roomLink.href = `/${room}`;
	roomLink.innerText = 'join';
	roomContainer.append(roomElement);
	roomContainer.append(roomLink);
});

socket.on('load-messages', (messages) => {
	console.log(messages);
	for (const message of messages) {
		appendMessage(`${message.name}: ${message.text}`, message.date);
	}
});

socket.on('user-error', (name) => {
	console.log('user-error', name);
	alert(`${name} is not a valid user!`);
});

socket.on('chat-message', (data) => {
	console.log(data);
	appendMessage(`${data.name}: ${data.message}`, data.date);
});

socket.on('user-connected', (name) => {
	console.log(name);
	appendMessage(`${name} connected`, Date.now());
});

socket.on('user-disconnected', (name) => {
	appendMessage(`${name} disconnected`, Date.now());
});

function appendMessage(message, date) {
	const messageElement = document.createElement('div');
	messageElement.innerHTML = `${message} <br/> at: ${new Date(
		date
	).toISOString()}`;
	messageContainer.append(messageElement);
}
