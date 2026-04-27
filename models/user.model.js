const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: {type: String, default: "default"},
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

module.exports = mongoose.model('User', userSchema);
