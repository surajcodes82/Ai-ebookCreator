const mongoose = require('mongoose');
const { WRITING_STYLES } = require('../utils/constants');

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: 200,
      default: 'Untitled Chapter',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: 200,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    author: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    style: {
      type: String,
      enum: WRITING_STYLES,
      default: 'Informative',
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

bookSchema.pre('validate', function resequence(next) {
  if (Array.isArray(this.chapters)) {
    this.chapters.forEach((chapter, index) => {
      chapter.order = index;
    });
  }
  next();
});

bookSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
