const mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
    postedUser: mongoose.Schema.Types.ObjectId,
    datePosted: {type:Date, required:true},
    content: {type:String, required:true}
});

module.exports = mongoose.model('Comment', commentSchema);