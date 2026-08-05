const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Validation rules for create
const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('totalCapacity')
    .isInt({ min: 1 })
    .withMessage('Total capacity must be a positive integer'),
  body('ticketPrice')
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a non-negative number'),
];

// Routes
router.get('/', getEvents);                                   // Public
router.get('/:id', getEventById);                             // Public
router.post('/', protect, upload.single('image'), createEventValidation, createEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
