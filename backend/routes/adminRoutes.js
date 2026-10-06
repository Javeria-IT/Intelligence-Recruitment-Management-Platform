// routes/adminRoutes.js
const express = require('express');
const {
  getAllUsers,
  deleteUser,
  getAllJobsAdmin,
  removeJobAdmin,
  getReports,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));


router.get('/users', getAllUsers);

router.delete('/user/:id', deleteUser);

router.get('/jobs', getAllJobsAdmin);

router.delete('/jobs/:id', removeJobAdmin);

router.get('/reports', getReports);

module.exports = router;
