const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [500, 'Name cannot exceed 500 characters']
  },
  email: {
    type: String,
    required: [true, 'Email field is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt fields
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
