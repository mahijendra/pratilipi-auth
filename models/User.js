const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});


UserSchema.methods.comparePassword = function(password, cb){
  bcrypt.compare(password, this.password, function(err, isMatch){
    if(err){
      return cb(err)
    }
    cb(null, isMatch)
  })
}

// Create Model from schema
const User = mongoose.model("User", UserSchema);

module.exports = User;
