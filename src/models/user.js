const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		socketId: {
			type: String,
			required: false,
		},
		friends: [
			{
				_id: false,
				userId: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: 'User',
				},
				messages: [
					{
						_id: false,
						text: {
							type: String,
							required: true,
						},
						sendingDate: {
							type: Date,
							required: true,
						},
					},
				],
			},
		],
	},
	{ timestamps: true, toJSON: true }
);

module.exports = mongoose.model('User', userSchema);
