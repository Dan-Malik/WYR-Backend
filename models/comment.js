const mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
    postedUser: mongoose.Schema.Types.ObjectId,
    postedUserName: {type: String, required:true},
    datePosted: {type:Date, required:true},
    content: {type:String, required:true}
});

module.exports = mongoose.model('Comment', commentSchema);