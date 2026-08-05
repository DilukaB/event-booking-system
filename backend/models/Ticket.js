const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    ticketQuantity: {
      type: Number,
      required: [true, 'Ticket quantity is required'],
      min: [1, 'Must book at least 1 ticket'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled'],
      default: 'Confirmed',
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Populate eventId and userId automatically on find
ticketSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'eventId',
    select: 'title date venue ticketPrice status imageUrl',
  }).populate({
    path: 'userId',
    select: 'name email',
  });
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
