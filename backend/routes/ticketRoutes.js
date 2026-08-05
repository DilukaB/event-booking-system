const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  bookTicket,
  getMyTickets,
  getTicketById,
  cancelTicket,
  deleteTicket,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules for booking
const bookTicketValidation = [
  body('eventId').notEmpty().withMessage('Event ID is required').isMongoId().withMessage('Invalid Event ID'),
  body('ticketQuantity')
    .isInt({ min: 1 })
    .withMessage('Ticket quantity must be at least 1'),
];

// All ticket routes require authentication
router.use(protect);

router.post('/', bookTicketValidation, bookTicket);
router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicketById);
router.put('/:id/cancel', cancelTicket);
router.delete('/:id', deleteTicket);

module.exports = router;
