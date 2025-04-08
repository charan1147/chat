const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'] // Basic email validation
  },
  password: { type: String, required: true },
  contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  callHistory: [{
    participant: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    duration: Number
  }]
});

module.exports = mongoose.model('User', userSchema);