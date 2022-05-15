const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		messages: [
			{
				_id: false,
				text: {
					type: String,
					required: true,
				},
				userId: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: 'User',
				},
				sendingDate: {
					type: Date,
					required: true,
				},
			},
		],

		usersConnected: [
			//ToDo get all online Users
			{
				_id: false,
				userId: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: 'User',
				},
				socketId: {
					type: String,
					required: true,
				},
			},
		],
	},
	{ timestamps: true, toJSON: true, versionKey: false }
);

module.exports = mongoose.model('Room', roomSchema);
