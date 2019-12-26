require('dotenv').config();
const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Models
let User = require('./models/user');
let Question = require('./models/question');
let Comment = require('./models/comment');

const logger = (req, res, next) => {
    console.log(`${req.method} request at ${req.protocol}://${req.get('host')}${req.url} on ${moment().format()}`);
    next();
}

const app = express();
const port = process.env.PORT || 4000;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;

app.use(logger);
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

db.once('open', () => console.log("MongoDB connection established!"));


app.post('/api/users/', (req, res) => {

    if (!req.body.email || !req.body.username || !req.body.password) {
        return res.status(400).send({ message: "Fields missing from user creation request!" });
    }

    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            return res.status(400).send({ message: "User with that email already exists!" });
        }

        //Password salt and hash
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.password, salt, (err, hash) => {
                if (err) {
                    console.log(error);
                    return res.status(400).send({ message: "Failed at password encryption" });
                }

                console.log(hash)

                const newUser = new User({
                    _id: new mongoose.Types.ObjectId(),
                    email: req.body.email,
                    username: req.body.username,
                    password: hash,
                    userDateCreated: Date.now()
                });

                newUser.save(function (err, user) {
                    if (err) {
                        console.log(err);
                        return res.status(400).send({ message: "Error creating new user!" });
                    }

                    console.log(`New user created: ${user.username}, ${user.email}`)
                    res.status(200).send({ message: `New user created: ${user.username}, ${user.email}` });
                });

            })
        });






    })


});





app.get('/api/users', (req, res) => {
    User.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            res.json(users);
        }
    })
});

app.get('/api/users/:id', (req, res) => {
    User.findById(req.params.id, function (err, user) {
        if (err) {
            console.log(err);
            res.status(404).send({ message: "User with that ID not found!" });
        } else {
            res.json(user);
        }
    })
});

app.delete('/api/users/:id', (req, res) => {
    User.findByIdAndDelete(req.params.id, function (err, user) {
        if (err) {
            console.log(err);
            res.status(404).send({ message: "User with that ID not found!" });
        } else {
            console.log(`User ${req.params.id} deleted!`);

            //DELETE QUESTIONS POSTED BY THIS USER(
            Question.deleteMany({ createdBy: req.params.id }, (err, question) => {
                if (err) {
                    console.log(err);
                    res.status(404).send({ message: `No questions from user ${req.params.id} not found!` });
                } else {
                    console.log(`Question ${question._id} deleted!`);
                }
            });

            //DELETION OF USERID FROM ALL QUESTION VOTES
            //NEEDS TESTING
            Question.find({ $or: [{ votesA: req.params.id }, { votesB: req.params.id }] }, (err, questions) => {
                console.log("Affected question found");
                console.log(questions);
                if (err) {
                    console.log("Error at userid deletion from questions!")
                    console.log(err);
                }
                else {
                    questions.map((question) => {
                        question.votesA = question.votesA.filter(userId => userId != req.params.id);
                        question.votesB = question.votesB.filter(userId => userId != req.params.id);
                        question.save((err, doc) => {
                            if (err) {
                                console.log(error);
                            } else {
                                console.log(`Question ${doc._id} votes updated!`);
                            }
                        })
                    })
                }
            });

            res.status(200).send({ message: `User ${req.params.id} deleted!` });
        }
    })
});

//Create question
app.post('/api/questions', (req, res) => {

    const creatorId = req.body.createdBy
    const questionId = new mongoose.Types.ObjectId();

    const newQuestion = new Question({
        _id: questionId,
        optionA: req.body.optionA,
        optionB: req.body.optionB,
        createdBy: creatorId,
        dateCreated: Date.now(),
        votesA: [],
        votesB: [],
        comments: []
    });

    newQuestion.save().then(() => {
        console.log("New question created!");
        res.status(200).send({ message: `New question ${questionId} saved!` })
    });

})

//Get all questions
app.get('/api/questions', (req, res) => {
    Question.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            res.json(users);
        }
    })
});

//Get question by ID
app.get('/api/questions/:id', (req, res) => {
    Question.findById(req.params.id, function (err, question) {
        if (err) {
            console.log(err);
        } else {
            res.json(question);
        }
    })
});

//Delete a question
app.delete('/api/questions/:id', (req, res) => {

    Question.findByIdAndDelete(req.params.id, function (err, question) {

        if (err) {
            console.log(`Failed to delete question ${req.params.id}`);
            console.log(err);
            return res.status(404).send({ message: `Failed to delete question ${req.params.id}` });
        } else {
            console.log(`Question ${req.params.id} deleted!`);
            return res.status(200).send({ message: `Question ${req.params.id} deleted!` });
        }

    });
});

//Vote on question
app.post('/api/questions/:id/vote', (req, res) => {

    //Typical request
    // voteA - True means vote for A, false means vote for B
    // if unvote is true, all user references removed from votes
    // {userId: "blahblahblah", voteA:true, unvote: false}

    Question.find(req.params.id, function (err, question) {
        if (err) {
            console.log(`Failed to vote on question ${req.params.id}`);
            console.log(err);
            return res.status(404).send({ message: `Failed to vote on question ${req.params.id}` });
        } else {

            if (!unvote) {

                if (question.votesA.includes(req.body.userId)) {

                    if (!voteA) {
                        question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
                        question.votesB.push(req.body.userId)
                    }

                } else if (question.votesB.includes(req.body.userId)) {

                    if (voteA) {
                        question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })
                        question.votesA.push(req.body.userId)
                    }

                } else {

                    if (voteA) {
                        question.votesA.push(req.body.userId)
                    } else if (!voteA) {
                        question.votesB.push(req.body.userId)
                    }

                }

            } else {

                question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
                question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })

            }

            question.save().then(() => {
                console.log(`Votes updated for question ${req.params.id}`);
                return res.status(200).send({ message: `Votes updated for question ${req.params.id}` });
            });

        }

    });

});

//Get comments from question
app.get('/api/questions/:id/comments', (req, res) => {
    Question.findById({ _id: req.params.id }, (err, question) => {
        if (err) { console.log(err); return res.status(404); }

        Comment.find({ _id: { $in: question.comments } }, (err, comments) => {
            console.log(`Comments retrieved from ${req.params.id}`);
            res.status(200).send(comments);
        })
    })
})

//Create comment
app.post('/api/questions/:id/comments', (req, res) => {

    //Typical request
    // {postedUser: "srhgsf", content "What a stupid question!"}


    const newComment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        postedUser: req.body.postedUser,
        datePosted: Date.now(),
        content: req.body.content
    })

    newComment.save(function (err, comment) {
        if (err) {
            console.log(err);
            return res.status(404);
        }
        console.log(`New comment created: ${comment._id}`)

        Question.findOne({ _id: req.params.id }, (err, question) => {
            if (err) {
                console.log(err);
                return res.status(404);
            }
            question.comments.push(comment._id);
            question.save().then(res.status(200).send({ message: `New comment created: ${comment._id}` }));
        })
    });
});


app.listen(port, () => console.log(`Server listening on port ${port}!`));