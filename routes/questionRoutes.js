const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//Model
const Question = require('../models/question');

const auth = require('../middleware/auth');


//Post at /api/questions to create questions
//Typical request {optionA: "do one thing", option2:"do another", createdBy:"idofcreatoruser"}
router.post('/', auth, (req, res) => {

    const questionId = new mongoose.Types.ObjectId();
    const newQuestion = new Question({
        _id: questionId,
        optionA: req.body.optionA,
        optionB: req.body.optionB,
        createdBy: req.body.createdBy,
        dateCreated: Date.now(),
        votesA: [],
        votesB: [],
        comments: []
    });

    newQuestion.save().then(() => {
        console.log("New question created!");
        res.status(200).send({ message: `New question ${questionId} saved!` })
    });
});


//Get all questions
router.get('/', (req, res) => {
    Question.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            res.json(users);
        }
    })
});

//Get question by ID
router.get('/:id', (req, res) => {
    Question.findById(req.params.id, function (err, question) {
        if (err) {
            console.log(err);
            res.status(400).send({message: "Something went wrong!"});
        } else {
            res.json(question);
        }
    })
});

//Delete a question by id
router.delete('/:id', auth, (req, res) => {

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
router.post('/:id/vote', auth, (req, res) => {

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
router.get('/:id/comments', (req, res) => {
    Question.findById({ _id: req.params.id }, (err, question) => {
        if (err) { console.log(err); return res.status(404); }

        Comment.find({ _id: { $in: question.comments } }, (err, comments) => {
            console.log(`Comments retrieved from ${req.params.id}`);
            res.status(200).send(comments);
        })
    })
})

//Create comment
router.post('/:id/comments', auth, (req, res) => {

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


module.exports = router;