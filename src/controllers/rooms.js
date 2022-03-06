const io = require('../util/socket').getIO();

const { v4: uuidv4 } = require('uuid');

const { getUserRooms } = require('../util/userRooms');
const Room = require('../models/room');
const User = require('../models/user');

io.on('connection', (socket) => {
	console.log('new user connected, socket: ', socket.id);
	socket.on('new-user', (roomName, name) => {
		Room.findOne({ name: roomName })
			.populate('messages.userId')
			.then(async (room) => {
				if (room) {
					const user = await User.findOne({ name }).catch((err) =>
						console.log(err)
					);
					if (user) {
						room.usersConnected.push({
							socketId: socket.id,
							userId: user._id,
						});
						await room.save();
						const messagesMapped = room.messages.map((message) => {
							//Map messages to only get the name
							return {
								text: message.text,
								name: message.userId.name,
								date: message.sendingDate,
							};
						});
						console.log(
							'new user on room: ',
							room.name,
							user.name,
							messagesMapped
						);
						socket.join(roomName);
						socket.emit('load-messages', messagesMapped);
						socket.broadcast
							.to(roomName)
							.emit('user-connected', name);
					} else socket.emit('user-error', name);
				}
			});
	});
	socket.on('send-chat-message', async (roomName, message) => {
		Room.findOne({ name: roomName })
			.then(async (room) => {
				if (room) {
					const userSocket = room.usersConnected.find(
						(userItem) => userItem.socketId == socket.id
					);
					if (userSocket) {
						const user = await User.findById(
							userSocket.userId
						).catch((err) => console.log(err));
						console.log(
							'new message: ',
							room.name,
							user.name,
							message
						);
						room.messages.push({
							text: message,
							userId: user._id,
							sendingDate: Date.now(),
						});
						await room.save();
						socket.broadcast.to(roomName).emit('chat-message', {
							message,
							name: user.name,
							date: Date.now(),
						});
					}
				}
			})
			.catch((err) => console.log(err));
	});
	socket.on('disconnect', async () => {
		const userRooms = await getUserRooms(socket);
		console.log('userRooms (disconnect): ', userRooms);

		for (const room of userRooms) {
			console.log('room:', room);
			socket.broadcast
				.to(room.roomName)
				.emit('user-disconnected', room.username);
			await Room.find({ name: room.roomName }) //*remove the socket from the database
				.select('usersConnected')
				.then(async (rooms) => {
					for (const room of rooms) {
						const userRemovedIndex = room.usersConnected.findIndex(
							(userItem) => {
								userItem.socketId == socket.id;
							}
						);
						if (userRemovedIndex != undefined) {
							room.usersConnected.splice(userRemovedIndex, 1);
							await room.save();
						}
						console.log(room);
					}
				})
				.catch((err) => console.log(err));
		}

		//delete rooms[room].users[socket.id];
	});
});

exports.getIndex = (req, res, next) => {
	Room.find({})
		.select('name')
		.then((rooms) => {
			res.status(200).render('index', { rooms });
		})
		.catch((err) => console.log(err));
};

exports.postCreateRoom = (req, res, next) => {
	const { room } = req.body;

	Room.findOne({ name: room })
		.then(async (existingRoom) => {
			if (existingRoom) return res.redirect('/');
			const newRoom = new Room({
				name: room,
				usersConnected: [],
				messages: [],
			});
			await newRoom.save();
			// rooms[req.body.room] = { users: {} };
			res.redirect(room);
			// Send message that new room was created
			io.emit('room-created', room);
		})
		.catch((err) => console.log(err));
};

exports.getRoom = (req, res, next) => {
	const { room } = req.params;
	console.log('into room', room);
	Room.findOne({ name: room })
		.then(async (existingRoom) => {
			if (!existingRoom) return res.redirect('/');
			res.status(200).render('room', { roomName: room });
		})
		.catch((err) => console.log(err));
};
