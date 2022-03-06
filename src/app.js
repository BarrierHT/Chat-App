const path = require('path');

const express = require('express');
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const app = express();
const server = require('http').Server(app);
require('./util/socket').init(server); //*Important to set after the server
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const User = require('./models/user');
const roomRouter = require('./routes/rooms');

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDatabase = process.env.MONGO_DATABASE;
const mongoCluster = process.env.MONGO_CLUSTER;
const mongoDBUrl = `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoCluster}.msdnf.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;

app.set('views', './src/views');
app.set('view engine', 'ejs');
app.set('PORT', process.env.PORT || 3000);

app.use(
	helmet(),
	helmet.contentSecurityPolicy({
		useDefaults: true,
		directives: {
			'script-src': ["'self'", "'unsafe-inline'"],
			'script-src-elem': [
				"'self'",
				'https://cdnjs.cloudflare.com',
				"'unsafe-inline'",
			],
		},
	})
);

app.use(
	cors({
		origin: ['http://localhost:3000'],
		methods: ['GET', 'POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.use(morgan('short'));

app.use('/', roomRouter);

mongoose
	.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true }) //Connect to MongoDB
	.then((result) => server.listen(app.get('PORT')))
	.then(async (result) => {
		const user = await User.findOne({ name: 'test1' });
		if (!user) {
			for (let i = 1; i <= 4; i++) {
				const user = new User({
					name: `test${i}`,
				});
				await user.save();
			}
		}
	})
	.catch((err) => console.log(err));
