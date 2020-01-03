const mongoose = require('mongoose');

let questionSchema = mongoose.Schema({
    optionA: { type: String, required: true},
    optionB: { type: String, required: true},
    createdBy: mongoose.Schema.Types.ObjectId,
    dateCreated: {type:Date, required:true},
    votesA: [String],
    votesB: [String],
    comments: [mongoose.Schema.Types.ObjectId]
});

module.exports = mongoose.model('Question', questionSchema);