// models/User.js
// Core user account used for authentication.
// Candidates, recruiters, and admins are all stored here,
// differentiated by the `role` field.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  { // PERSONAL INFORMATION
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },

    profileImage: {
      type: String,
      default: '',
    },

   
    // ROLE
    
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      default: 'candidate',
    },

    // COMPANY INFORMATION
  
    companyName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },

    companyWebsite: {
      type: String,
      trim: true,
      default: '',
    },

    industry: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },

    companyLocation: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },

    companyDescription: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },


    // RECRUITER INFORMATION

    jobTitle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },

    department: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },

    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },

    linkedinProfile: {
      type: String,
      trim: true,
      default: '',
    },

    // ACCOUNT STATUS
   
    isActive: {
      type: Boolean,
      default: true,
    },

    // EMAIL / OTP VERIFICATION
    // Defaults to true so accounts that existed before this module
    // shipped are never locked out; registration explicitly overrides
    // this to false for brand-new signups (see authController.register).
    isVerified: {
      type: Boolean,
      default: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


// HASH PASSWORD BEFORE SAVE

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});


// COMPARE PASSWORD

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


// REMOVE SENSITIVE FIELDS

userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;
  delete obj.__v;

  return obj;
};

module.exports = mongoose.model('User', userSchema);