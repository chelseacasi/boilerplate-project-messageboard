const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReplySchema = new Schema({
  text: String,
  delete_password: String,
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new Schema({
  board: String,
  text: String,
  delete_password: String,
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [ReplySchema]
});

module.exports = {
  Thread: mongoose.model('Thread', ThreadSchema),
  Reply: mongoose.model('Reply', ReplySchema)
};