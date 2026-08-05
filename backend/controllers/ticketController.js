const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { validationResult } = require('express-validator');

// @desc    Book a ticket
// @route   POST /api/tickets
// @access  Private
const bookTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { eventId, ticketQuantity } = req.body;
    const qty = parseInt(ticketQuantity, 10);

    // ─── Business Logic: Check event exists ───────────────────────────────────
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check event is active
    if (event.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot book tickets for a cancelled event' });
    }

    if (event.status === 'Sold Out') {
      return res.status(400).json({ success: false, message: 'This event is sold out' });
    }

    // ─── Business Logic: Seat availability check ──────────────────────────────
    if (qty > event.availableSeats) {
      return res.status(400).json({
        success: false,
        message: `Insufficient seats. Only ${event.availableSeats} seat(s) available, but you requested ${qty}`,
      });
    }

    const totalAmount = qty * event.ticketPrice;

    // Create ticket
    const ticket = await Ticket.create({
      eventId,
      userId: req.user._id,
      ticketQuantity: qty,
      totalAmount,
      status: 'Confirmed',
      bookedAt: new Date(),
    });

    // ─── Business Logic: Deduct seats & update event status ───────────────────
    event.availableSeats -= qty;
    if (event.availableSeats === 0) {
      event.status = 'Sold Out';
    }
    await event.save();

    // Fetch populated ticket for response
    const populatedTicket = await Ticket.findById(ticket._id);

    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully',
      ticket: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's tickets
// @route   GET /api/tickets/my-tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .sort({ bookedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only owner can view their ticket
    if (ticket.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a ticket
// @route   PUT /api/tickets/:id/cancel
// @access  Private
const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this ticket' });
    }

    if (ticket.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Ticket is already cancelled' });
    }

    // ─── Business Logic: Cancellation ─────────────────────────────────────────
    ticket.status = 'Cancelled';
    await ticket.save();

    // Release seats back to event
    const event = await Event.findById(ticket.eventId._id || ticket.eventId);
    if (event) {
      event.availableSeats += ticket.ticketQuantity;
      // Re-activate if event was Sold Out
      if (event.status === 'Sold Out') {
        event.status = 'Active';
      }
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Ticket cancelled successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ticket history
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this ticket' });
    }

    // Only allow deleting cancelled tickets to preserve booking history
    if (ticket.status === 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a confirmed ticket. Please cancel it first.',
      });
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Ticket history deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookTicket, getMyTickets, getTicketById, cancelTicket, deleteTicket };
