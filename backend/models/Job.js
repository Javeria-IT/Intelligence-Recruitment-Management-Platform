// models/Job.js
// Job postings created by recruiters.

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String, // e.g. "2-4 years"
      default: '0-1 years',
    },
    salary: {
      type: String, // free-form to support ranges/currencies
      default: 'Not disclosed',
    },
    deadline: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index to speed up searching/filtering jobs by skills and active status
jobSchema.index({ requiredSkills: 1, isActive: 1 });

module.exports = mongoose.model('Job', jobSchema);
