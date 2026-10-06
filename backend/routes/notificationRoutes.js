// routes/notificationRoutes.js
const express = require('express');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);


router.get('/', getMyNotifications);

router.put('/read/:id', markAsRead);

router.put('/read-all', markAllAsRead);

module.exports = router;
