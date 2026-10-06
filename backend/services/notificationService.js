// services/notificationService.js
// Centralized logic for creating notifications, called from various
// controllers (applications, interviews, admin actions, etc.).

const Notification = require('../models/Notification');

/**
 * Creates a single notification for a user.
 */
async function createNotification({ userId, title, message, type = 'general' }) {
  return Notification.create({ userId, title, message, type });
}

/**
 * Creates notifications for multiple users at once (e.g. broadcast).
 */
async function createBulkNotifications(userIds = [], { title, message, type = 'general' }) {
  const docs = userIds.map((userId) => ({ userId, title, message, type }));
  return Notification.insertMany(docs);
}

// Convenience wrappers for the specific events required by the platform

const notifyNewApplication = (recruiterId, candidateName, jobTitle) =>
  createNotification({
    userId: recruiterId,
    title: 'New Application Received',
    message: `${candidateName} applied for the position: ${jobTitle}`,
    type: 'new_application',
  });

const notifyShortlisted = (candidateId, jobTitle) =>
  createNotification({
    userId: candidateId,
    title: 'You have been shortlisted!',
    message: `Congratulations! You were shortlisted for: ${jobTitle}`,
    type: 'shortlisted',
  });

const notifyInterviewScheduled = (candidateId, jobTitle, date) =>
  createNotification({
    userId: candidateId,
    title: 'Interview Scheduled',
    message: `Your interview for "${jobTitle}" has been scheduled on ${new Date(
      date
    ).toLocaleString()}`,
    type: 'interview_scheduled',
  });

const notifyRejected = (candidateId, jobTitle) =>
  createNotification({
    userId: candidateId,
    title: 'Application Update',
    message: `We regret to inform you that your application for "${jobTitle}" was not successful this time.`,
    type: 'rejected',
  });

const notifySelected = (candidateId, jobTitle) =>
  createNotification({
    userId: candidateId,
    title: 'Congratulations, You are Selected!',
    message: `You have been selected for the position: ${jobTitle}`,
    type: 'selected',
  });

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyNewApplication,
  notifyShortlisted,
  notifyInterviewScheduled,
  notifyRejected,
  notifySelected,
};
