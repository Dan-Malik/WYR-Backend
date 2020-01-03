const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

//Model
let User = require('../models/user');



//POST /api/auth to authenticate user
router.post('/', (req, res) => {

    //Check user credentials in db match those in request
    // Typical request: {email: "dan@yahoo.com", password: "password"}

    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ message: "Fields missing from user auth request!" });
    }

    User.findOne({ email: req.body.email }).then(user => {

        console.log("email req:");
        console.log(req.body.email);

        if (!user) {
            console.log("User doesn't exist!");
            return res.status(400).send({ message: "Authentication request failed, user not found!." });
        }


        bcrypt.compare(req.body.password, user.password, function (err, compareResult) {

            if (!compareResult) {
                console.log("Password incorrect!");                
                return res.status(400).send({ message: "Authentication request failed, password does not match" })
            }
            
            jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 4800 }, (err, token) => {

            if (err) {
                console.log(err);
                return res.status(400).send({ message: "Error generating new token." });
            }

            console.log(`New jwt created for ${user.username}, ${user.email}`)
            res.status(200).json({ token, new_user: { id: user.id, username: user.username, email: user.email } });

        })
    })
    })
});

//Get /api/auth/users/ to get user by ID
router.get('/users/', auth, (req, res) => {
    User.findById(req.user.id).select('-password').then( 
            res.json(user)
    ); 
});


// //Development purposes only
// //Get /api/users to get all users
// router.get('/', (req, res) => {
//     User.find({}, function (err, users) {
//         if (err) {
//             console.log(err);
//         } else {
//             res.json(users);
//         }
//     })
// });

// //Delete /api/users/id to delete a user by id
// router.delete('/:id', (req, res) => {
//     User.findByIdAndDelete(req.params.id, function (err, user) {
//         if (err) {
//             console.log(err);
//             res.status(404).send({ message: "User with that ID not found!" });
//         } else {
//             console.log(`User ${req.params.id} deleted!`);

//             //DELETE QUESTIONS POSTED BY THIS USER(
//             Question.deleteMany({ createdBy: req.params.id }, (err, question) => {
//                 if (err) {
//                     console.log(err);
//                     res.status(404).send({ message: `No questions from user ${req.params.id} not found!` });
//                 } else {
//                     console.log(`Question ${question._id} deleted!`);
//                 }
//             });

//             //DELETION OF USERID FROM ALL QUESTION VOTES
//             //NEEDS TESTING
//             Question.find({ $or: [{ votesA: req.params.id }, { votesB: req.params.id }] }, (err, questions) => {
//                 console.log("Affected question found");
//                 console.log(questions);
//                 if (err) {
//                     console.log("Error at userid deletion from questions!")
//                     console.log(err);
//                 }
//                 else {
//                     questions.map((question) => {
//                         question.votesA = question.votesA.filter(userId => userId != req.params.id);
//                         question.votesB = question.votesB.filter(userId => userId != req.params.id);
//                         question.save((err, doc) => {
//                             if (err) {
//                                 console.log(error);
//                             } else {
//                                 console.log(`Question ${doc._id} votes updated!`);
//                             }
//                         })
//                     })
//                 }
//             });

//             res.status(200).send({ message: `User ${req.params.id} deleted!` });
//         }
//     })
// });

module.exports = router;