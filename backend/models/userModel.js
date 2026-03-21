const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    relation: { type: String, required: true }
});

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true, unique: true },
    aadhaar: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    emergencyContacts: [emergencyContactSchema]
});

module.exports = mongoose.model('User', userSchema);