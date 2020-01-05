const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//Model
const Question = require('../models/question');
const Comment = require('../models/comment');

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

//Development
//Get all questions
router.get('/all', (req, res) => {
    Question.find({}, function (err, users) {
        if (err) {
            console.log(err);
        } else {
            res.json(users);
        }
    })
});

//Get question by ID
router.get('/:id/get', (req, res) => {
    Question.findById(req.params.id, function (err, question) {
        if (err) {
            console.log(err);
            res.status(400).send({ message: "Something went wrong!" });
        } else {


            res.status(200).json(question);

            
        }
    })
});

//Get question by id and comment objects
router.get('/:id', (req, res) => {
    Question.findById(req.params.id, function (err, question) {
        if (err) {
            console.log(err);
            return res.status(400).send({ message: "Something went wrong!" });
        } else {
            
            Comment.find({ _id: { $in: question.comments } }, (err, comments) => {
                console.log(`Comments retrieved from ${req.params.id}`);
            
                return res.status(200).json({questionData: question, comments: comments});
            });

        }
    })
});

//Get random question
router.get('/random/id',(req,res)=>{
      
        Question.aggregate([{ $sample: { size: 1 } }],
          function (err, result) {
            if(err){
                console.log(err);
                res.status(400).send({ message: "Something went wrong!" });
    
            } else {
                console.log(result);
                res.status(200).json(result);
            }
          })

        }
      );


//Development
//Delete a question by id
router.delete('/:id', (req, res) => {

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

router.post('/:id/vote', (req, res) => {

    //Typical request
        // {userId: "blahblahblah", voteA:true, unvote: false}
    // voteA - True means vote for A, false means vote for B
    // if unvote is true, all user references removed from votes
    //For guest request:
        // {voteA: true} or {voteA: false}

    Question.findById(req.params.id, function (err, question) {
        if (err) {
            console.log(`Failed to vote on question ${req.params.id}`);
            console.log(err);
            return res.status(400).send({ message: `Failed to vote on question ${req.params.id}` });
        } else {

            //If user is logged in and voting
            if (req.body.userId) {

                //If not unvoting
                if (!req.body.unvote) {

                    if (question.votesA.includes(req.body.userId)) {

                        if (!req.body.voteA) {
                            question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
                            question.votesB.push(req.body.userId)
                        }

                    } else if (question.votesB.includes(req.body.userId)) {

                        if (req.body.voteA) {
                            question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })
                            question.votesA.push(req.body.userId)
                        }

                    } else {

                        if (req.body.voteA) {
                            question.votesA.push(req.body.userId)
                        } else if (!req.body.voteA) {
                            question.votesB.push(req.body.userId)
                        }

                    }

                } else {

                    question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
                    question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })

                }


            } else {

                //If guest is voting

                voteSessionObj = {questionId: req.params.id, voteA: req.body.voteA}

                //If user session has no votes array
                if(!req.session.votes){
                    req.session.votes=[voteSessionObj];

                    if(req.body.voteA){
                        question.votesA.push(req.session.id);
                    } else {
                        question.votesB.push(req.session.id);
                    }

                    //If user session has votes, but none for this question
                } else if(req.session.votes.filter(voteSessionObj => voteSessionObj.questionId === req.params.id).length === 0 ){
                    req.session.votes.push(voteSessionObj);

                    if(req.body.voteA){
                        question.votesA.push(req.session.id);
                    } else {
                        question.votesB.push(req.session.id);
                    }

                    //No unvoting for guests!
                }
                }
            }



            question.save().then(() => {
                console.log(`Votes updated for question ${req.params.id}`);
                return res.status(200).json(question);
            });

        }

    );

});



//Vote on question
// router.post('/:id/vote', auth, (req, res) => {

//     //Typical request
//     // voteA - True means vote for A, false means vote for B
//     // if unvote is true, all user references removed from votes
//     // {userId: "blahblahblah", voteA:true, unvote: false}

//     Question.find(req.params.id, function (err, question) {
//         if (err) {
//             console.log(`Failed to vote on question ${req.params.id}`);
//             console.log(err);
//             return res.status(404).send({ message: `Failed to vote on question ${req.params.id}` });
//         } else {

//             if (!unvote) {

//                 if (question.votesA.includes(req.body.userId)) {

//                     if (!voteA) {
//                         question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
//                         question.votesB.push(req.body.userId)
//                     }

//                 } else if (question.votesB.includes(req.body.userId)) {

//                     if (voteA) {
//                         question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })
//                         question.votesA.push(req.body.userId)
//                     }

//                 } else {

//                     if (voteA) {
//                         question.votesA.push(req.body.userId)
//                     } else if (!voteA) {
//                         question.votesB.push(req.body.userId)
//                     }

//                 }

//             } else {

//                 question.votesA = question.votesA.filter((userId) => { userId != req.body.userId })
//                 question.votesB = question.votesA.filter((userId) => { userId != req.body.userId })

//             }

//             question.save().then(() => {
//                 console.log(`Votes updated for question ${req.params.id}`);
//                 return res.status(200).send({ message: `Votes updated for question ${req.params.id}` });
//             });

//         }

//     });

// });

//Get comments from question
router.get('/:id/comment', (req, res) => {
    Question.findById({ _id: req.params.id }, (err, question) => {
        if (err) { console.log(err); return res.status(404); }

        Comment.find({ _id: { $in: question.comments } }, (err, comments) => {
            console.log(`Comments retrieved from ${req.params.id}`);
            res.status(200).send(comments);
        })
    })
})

//Delete comment
router.delete('/:id/comment/:commentid', (req,res)=>{
    Comment.findByIdAndDelete({ _id: req.params.commentid }, (err,comment) => {

        if (err) {
            console.log(err);

            return res.status(404);
        }

        console.log(comment)

    Question.findOne({ _id: req.params.id }, (err, question) => {
        if (err){


            console.log(err);

            return res.status(404);
        
        }

        console.log("Question located")
        question.comments = question.comments.filter(commentId => commentId!= req.params.commentid)

        question.save((err, doc) => {
            if (err) {
                console.log(error);
            } else {
                console.log(`Question ${doc._id} votes updated!`);
                console.log(doc);
                res.status(200).send({ comment})
            }
        })

    })
    })


})

//Create comment
router.post('/:id/comment', (req, res) => {

    //Typical request
    // {postedUser: "0x624tydvqeq34yq35uq35", postedUserName:"John Doe" content "What a stupid question!"}

    const newComment = new Comment({
        _id: new mongoose.Types.ObjectId(),
        postedUser: req.body.postedUser,
        postedUserName: req.body.postedUserName,
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
            question.save().then(res.status(200).send(comment));
        })
    });
});


module.exports = router;