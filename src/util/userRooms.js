const Room = require('../models/room');
const User = require('../models/user');

exports.getUserRooms = (socket) => {
	return Room.find({})
		.select('-messages')
		.populate('usersConnected.userId', 'name _id')
		.then((rooms) => {
			console.log('socket disconnected', socket.id, ' ');
			return rooms.reduce((names, roomItem) => {
				//Rooms that user was connected
				const room = roomItem.usersConnected.find(
					(userItem) => userItem.socketId == socket.id
				);
				if (room) {
					console.log('roomItem', roomItem);
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
