const Room = require('../models/room');

exports.getUserRooms = async (socket) => {
	return await Room.find()
		.select('-messages')
		.populate('usersConnected.userId', 'name _id')
		.then((rooms) => {
			return rooms.reduce((names, roomItem) => {
				//Rooms that user was connected
				const room = roomItem.usersConnected.find(
					(userItem) => userItem.socketId == socket.id
				);
				if (room) {
					// console.log('roomItem', roomItem);
					names.push({
						roomName: roomItem.name,
						username: room.userId.name,
					});
				}

				return names;
			}, []);
		})
		.catch((err) => console.log(err));
};

exports.getOnlineUsers = async (roomName) => {
	return await Room.findOne({ name: roomName })
		.select('-messages')
		.populate('usersConnected.userId', 'name')
		.then((room) => {
			let onlineUsers = [];
			if (room) {
				onlineUsers = room.usersConnected.map((user) => {
					return user.userId.name;
				});
				onlineUsers = [...new Set(onlineUsers)];
			}
			return onlineUsers;
		})
		.catch((err) => console.log(err));
};
