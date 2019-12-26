const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

let User = require('../models/user');


//POST /api/users to create user and generate web token
router.post('/', (req, res) => {

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

//Get /api/users/id to get user by ID
router.get('/:id', (req, res) => {
    User.findById(req.params.id, function (err, user) {
        if (err) {
            console.log(err);
            res.status(404).send({ message: "User with that ID not found!" });
        } else {
            res.json(user);
        }
    })
});


//Development purposes only
//Get /api/users to get all users
router.get('/', (req, res) => {
    User.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            res.json(users);
        }
    })
});

//Delete /api/users/id to delete a user by id
router.delete('/:id', (req, res) => {
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

module.exports = router;