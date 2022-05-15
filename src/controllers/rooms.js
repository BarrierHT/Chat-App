const io = require('../util/socket').getIO();

const Room = require('../models/room');
const User = require('../models/user');

exports.getIndex = (req, res, next) => {
	Room.find()
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
	// console.log('into room', room);
	Room.findOne({ name: room })
		.then((existingRoom) => {
			if (!existingRoom) return res.redirect('/');

			res.status(200).render('room', { roomName: room });
		})
		.catch((err) => console.log(err));
};

exports.getUserRoom = (req, res, next) => {
	const { username } = req.params;
	User.findOne({ name: username })
		.select('-friends')
		.then((user) => {
			if (!user) return res.redirect('/');
			res.status(200).render('userRoom', { roomName: username });
		})
		.catch((err) => console.log(err));
};
