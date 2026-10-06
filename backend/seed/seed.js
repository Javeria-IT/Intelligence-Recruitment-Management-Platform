// seed/seed.js
// Populates the database with sample admin, recruiter, candidate,
// job, and application data for local development/testing.
//
// Run with: npm run seed

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      CandidateProfile.deleteMany(),
      Job.deleteMany(),
      Application.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('Existing collections cleared.');

    // ---------- Users ----------
    const admin = await User.create({
      fullName: 'Platform Admin',
      email: 'admin@recruitai.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+10000000000',
    });

    const recruiter = await User.create({
      fullName: 'Sarah Recruiter',
      email: 'recruiter@recruitai.com',
      password: 'Recruiter@123',
      role: 'recruiter',
      phone: '+10000000001',
    });

    const candidate1 = await User.create({
      fullName: 'John Candidate',
      email: 'john@recruitai.com',
      password: 'Candidate@123',
      role: 'candidate',
      phone: '+10000000002',
    });

    const candidate2 = await User.create({
      fullName: 'Jane Applicant',
      email: 'jane@recruitai.com',
      password: 'Candidate@123',
      role: 'candidate',
      phone: '+10000000003',
    });

    console.log('Users created.');

    // ---------- Candidate Profiles ----------
    const profile1 = await CandidateProfile.create({
      userId: candidate1._id,
      skills: ['javascript', 'node.js', 'express', 'mongodb', 'react'],
      education: [
        {
          degree: 'B.Tech Computer Science',
          institution: 'State University',
          fieldOfStudy: 'Computer Science',
          startYear: 2016,
          endYear: 2020,
        },
      ],
      experience: [
        {
          title: 'Backend Developer',
          company: 'TechCorp',
          startDate: new Date('2020-07-01'),
          endDate: new Date('2023-06-30'),
          isCurrent: false,
          description: 'Built REST APIs using Node.js and Express.',
        },
      ],
      parsedResume: {
        rawText: 'John Candidate - 3 years of experience with node.js, express, mongodb...',
        extractedSkills: ['javascript', 'node.js', 'express', 'mongodb'],
        extractedEducation: ['B.Tech Computer Science'],
        extractedExperience: ['Backend Developer at TechCorp'],
        certifications: ['aws certified'],
        email: 'john@recruitai.com',
        phone: '+10000000002',
      },
      AI_score: 0,
    });

    const profile2 = await CandidateProfile.create({
      userId: candidate2._id,
      skills: ['python', 'django', 'machine learning', 'sql'],
      education: [
        {
          degree: 'M.Sc Data Science',
          institution: 'Tech Institute',
          fieldOfStudy: 'Data Science',
          startYear: 2018,
          endYear: 2020,
        },
      ],
      experience: [
        {
          title: 'Data Analyst',
          company: 'DataWorks',
          startDate: new Date('2020-01-01'),
          isCurrent: true,
          description: 'Working on ML models and data pipelines.',
        },
      ],
      parsedResume: {
        rawText: 'Jane Applicant - data scientist with 4 years experience in python, django...',
        extractedSkills: ['python', 'django', 'machine learning', 'sql'],
        extractedEducation: ['M.Sc Data Science'],
        extractedExperience: ['Data Analyst at DataWorks'],
        certifications: [],
        email: 'jane@recruitai.com',
        phone: '+10000000003',
      },
      AI_score: 0,
    });

    console.log('Candidate profiles created.');

    // ---------- Jobs ----------
    const job1 = await Job.create({
      recruiterId: recruiter._id,
      title: 'Backend Developer (Node.js)',
      company: 'RecruitAI Technologies',
      location: 'Remote',
      description:
        'We are looking for a skilled backend developer experienced with Node.js, Express, and MongoDB to build scalable REST APIs.',
      requiredSkills: ['javascript', 'node.js', 'express', 'mongodb', 'rest api'],
      experience: '2-4 years',
      salary: '$70,000 - $90,000',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const job2 = await Job.create({
      recruiterId: recruiter._id,
      title: 'Data Scientist',
      company: 'RecruitAI Technologies',
      location: 'New York, NY',
      description:
        'Seeking a data scientist with strong Python and machine learning skills to build predictive models.',
      requiredSkills: ['python', 'machine learning', 'sql', 'pandas'],
      experience: '3-5 years',
      salary: '$90,000 - $120,000',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    });

    console.log('Jobs created.');

    // ---------- Applications ----------
    await Application.create({
      candidateId: candidate1._id,
      jobId: job1._id,
      resume: profile1.resumeURL || '/uploads/resumes/sample-john.pdf',
      applicationStatus: 'applied',
    });

    await Application.create({
      candidateId: candidate2._id,
      jobId: job2._id,
      resume: profile2.resumeURL || '/uploads/resumes/sample-jane.pdf',
      applicationStatus: 'applied',
    });

    console.log('Sample applications created.');
    console.log('\n--- Seed data summary ---');
    console.log('Admin login:      admin@recruitai.com / Admin@123');
    console.log('Recruiter login:  recruiter@recruitai.com / Recruiter@123');
    console.log('Candidate login:  john@recruitai.com / Candidate@123');
    console.log('Candidate login:  jane@recruitai.com / Candidate@123');
    console.log('\nSeeding complete!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
