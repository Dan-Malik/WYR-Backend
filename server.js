require('dotenv').config();
const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');


//Models
let User = require('./models/user');
let Question = require('./models/question');
let Comment = require('./models/comment');

//Routers
let userRouter = require('./routes/userRoutes');
let questionRouter = require('./routes/questionRoutes');
let authRouter = require('./routes/authRoutes');

const logger = (req, res, next) => {
    console.log(`${req.method} request at ${req.protocol}://${req.get('host')}${req.url} on ${moment().format()}`);
    next();
}

const app = express();
const port = process.env.PORT || 4000;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;

app.use(cors());
app.use(logger);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({secret: process.env.SESS_SECRET}));


db.once('open', () => console.log("MongoDB connection established!"));


app.use('/api/users', userRouter);
app.use('/api/question', questionRouter);
app.use('/api/auth', authRouter);


app.listen(port, () => console.log(`Server listening on port ${port}!`));