const socket = io('http://localhost:3000', {
	auth: { name: localStorage.getItem('name') },
});
socket.emit('login', localStorage.getItem('name')); //*Always set an active socket (e.g. for notifications)

const messageContainer = document.getElementById('message-container');
const userContainer = document.querySelector('#users-container>ul');
const roomContainer = document.getElementById('room-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const logoutButton = document.getElementById('logout');
const loginButton = document.getElementById('login');

if (userContainer != null) {
	//* Normal Room
	const name = localStorage.getItem('name');
	if (name) {
		appendMessage('You joined', Date.now());
		console.log(name);
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
} else if (messageContainer != null) {
	//* Private Room
	const name = localStorage.getItem('name');

	if (name) {
		// socket.emit('new-user', roomName, name);
		console.log('sender: ', name, 'receiver: ', roomName);

		messageForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const message = messageInput.value;
			appendMessage(`You: ${message}`, Date.now());
			socket.emit('send-private-message', {
				sender: name,
				recipient: roomName,
				message,
			});
			messageInput.value = '';
		});
	}
} else {
	loginButton.addEventListener('click', (e) => {
		const name = document.querySelector('input[name="name"]').value;
		localStorage.setItem('name', name);
		console.log(name);
		socket.emit('login', name);
	});
	logoutButton.addEventListener('click', (e) => {
		localStorage.removeItem('name');
		socket.disconnect();
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

socket.on('load-room', (data) => {
	console.log(data);
	for (const username of data.onlineUsers) {
		appendUser(username);
	}
	for (const message of data.messages) {
		appendMessage(`${message.name}: ${message.text}`, message.date);
	}
});

socket.on('user-error', (name) => {
	console.log('user-error', name);
	alert(`${name} is not a valid user!`);
	localStorage.removeItem('name');
});

socket.on('chat-private-message', (data) => {
	console.log(data);

	if (typeof roomName !== 'undefined') {
		if (roomName == data.name)
			appendMessage(`${data.name}: ${data.message}`, data.date);
	} else {
		alert(`${data.name}: ${data.message}`);
	}
});

socket.on('chat-message', (data) => {
	//*Public room
	console.log(data);
	if (typeof roomName !== 'undefined') {
		appendMessage(`${data.name}: ${data.message}`, data.date);
	}
});

socket.on('user-connected', (name) => {
	console.log(name);
	appendMessage(`${name} connected`, Date.now());
	appendUser(name);
});

socket.on('user-disconnected', (name) => {
	const userElement = document.querySelector(
		`#users-container>ul li>a[href="/userRoom/${name}"]`
	);
	userElement.parentNode.remove();
	appendMessage(`${name} disconnected`, Date.now());
});

function appendMessage(message, date) {
	if (typeof messageContainer !== 'undefined') {
		const messageElement = document.createElement('div');
		messageElement.innerHTML = `${message} <br/> at: ${new Date(
			date
		).toISOString()}`;
		messageContainer.append(messageElement);
	}
}

function appendUser(username) {
	if (typeof userContainer !== 'undefined') {
		const userElement = document.createElement('li');
		userElement.className = 'list-element-user';
		userElement.innerHTML = `<a href="/userRoom/${username}">${username}<a/>`;
		userContainer.append(userElement);
	}
}
