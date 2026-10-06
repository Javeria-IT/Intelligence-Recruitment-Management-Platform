// controllers/notificationController.js
// Fetching and marking-as-read notifications for the logged-in user.

const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = catchAsync(async (req, res, next) => {
  const { unreadOnly } = req.query;

  const filter = { userId: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  return success(res, 200, 'Notifications fetched successfully', {
    notifications,
    unreadCount,
  });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/read/:id
// @access  Private
const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found', 404));

  if (notification.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this notification', 403));
  }

  notification.isRead = true;
  await notification.save();

  return success(res, 200, 'Notification marked as read', { notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  return success(res, 200, 'All notifications marked as read', null);
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
