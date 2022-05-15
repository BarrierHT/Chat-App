const io = require('../util/socket').getIO();

const { getUserRooms, getOnlineUsers } = require('../util/userRooms');
const Room = require('../models/room');
const User = require('../models/user');

io.on('connection', async (socket) => {
	console.log('new user connected, socket: ', socket.id);
	// console.log('handshake:', socket.handshake.auth);
	// let name = socket.handshake.auth.name;
	// if (name) {
	// }
	socket.on('new-user', (roomName, name) => {
		console.log('new user joined: ', roomName);
		Room.findOne({ name: roomName })
			.populate('messages.userId')
			.then(async (room) => {
				if (room) {
					const user = await User.findOne({ name })
						.select('-friends')
						.catch((err) => console.log(err));
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
						const onlineUsers = await getOnlineUsers(roomName);
						// console.log(
						// 	'new user on room: ',
						// 	room.name,
						// 	user.name,
						// 	onlineUsers,
						// messagesMapped
						// );
						socket.join(roomName);
						socket.emit('load-room', {
							messages: messagesMapped,
							onlineUsers,
						});
						socket.broadcast
							.to(roomName)
							.emit('user-connected', name);
					} else socket.emit('user-error', name);
				}
			})
			.catch((err) => console.log(err));
	});

	socket.on('send-chat-message', async (roomName, message) => {
		Room.findOne({ name: roomName })
			.then(async (room) => {
				if (room) {
					const userSocket = room.usersConnected.find(
						(userItem) => userItem.socketId == socket.id
					);
					if (userSocket) {
						const user = await User.findById(userSocket.userId)
							.select('-friends')
							.catch((err) => console.log(err));
						// console.log(
						// 	'new message: ',
						// 	room.name,
						// 	user.name,
						// 	message
						// );
						if (user) {
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
				}
			})
			.catch((err) => console.log(err));
	});
	// }

	socket.on(
		'send-private-message',
		async ({ sender, recipient, message }) => {
			console.log(sender, recipient, message);
			if (sender != recipient) {
				const userSender = await User.findOne({ name: sender })
					.populate('friends.userId', 'name _id')
					.catch((err) => console.log(err));
				if (userSender) {
					const userRecipient = await User.findOne({
						name: recipient,
					})
						.select('_id friends socketId')
						.catch((err) => console.log(err));

					if (userRecipient) {
						const friendIndex = userSender.friends.findIndex(
							(friend) => friend.userId.name == recipient
						);
						const messageObject = {
							text: message,
							sendingDate: Date.now(),
						};

						if (userRecipient.socketId) {
							//* If recipient is online
							console.log(
								'Socket of recipient: ',
								userRecipient.socketId
							);
							socket
								.to(userRecipient.socketId)
								.emit('chat-private-message', {
									name: sender,
									date: messageObject.sendingDate,
									message,
								});
						}

						if (friendIndex >= 0) {
							//* Save the message in the db
							console.log(recipient, 'is already A FRIEND');
							userSender.friends[friendIndex].messages.push(
								messageObject
							);
							await userSender.save();
						} else {
							//?Set recipient and sender as a friend
							console.log(recipient, 'is NOT A FRIEND');
							if (userRecipient) {
								userSender.friends.push({
									userId: userRecipient._id,
									messages: [messageObject],
								});
								userRecipient.friends.push({
									userId: userSender._id,
									messages: [],
								});
								await userSender.save();
								await userRecipient.save();
							}
						}
					}
				}
			}
		}
	);

	socket.on('login', async (name) => {
		if (name) {
			const user = await User.findOne({ name })
				.select('-friends')
				.catch((err) => console.log(err));
			if (!user) socket.emit('user-error', name);
			else {
				// console.log(user.name, 'is a REAL user');
				user.socketId = socket.id;
				await user.save();
				//* Set socket in db in the beggining of the socket.connection
			}
		}
	});

	socket.on('disconnect', async () => {
		console.log('socket disconnected', socket.id);
		const user = await User.findOne({ socketId: socket.id })
			.select('-friends')
			.catch((err) => console.log(err));
		if (user) {
			//* Unset socket from user using the socket.id from the db
			user.socketId = undefined;
			await user.save();

			const userRooms = await getUserRooms(socket);
			for (const room of userRooms) {
				// console.log('room:', room);
				socket.broadcast
					.to(room.roomName)
					.emit('user-disconnected', room.username);
				await Room.findOne({ name: room.roomName }) //*remove the socket from the database
					.select('usersConnected')
					.then(async (room) => {
						const userRemovedIndex = room.usersConnected.findIndex(
							(userItem) =>
								userItem.socketId.toString() ==
								socket.id.toString()
						);
						if (userRemovedIndex >= 0) {
							room.usersConnected.splice(userRemovedIndex, 1);
							await room.save();
						}
						// console.log(room);
					})
					.catch((err) => console.log(err));
			}
		}
	});
});
