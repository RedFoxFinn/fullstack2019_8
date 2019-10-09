const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    minlength: 2
  },
  published: {
    required: true,
    type: Number
  },
  author: {
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author'
  },
  genres: {
    required: true,
    type: [{type: String}]
  }
});

module.exports = mongoose.model('Book', bookSchema);