const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Total capacity must be at least 1'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [0, 'Available seats cannot be negative'],
    },
    ticketPrice: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Ticket price cannot be negative'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Sold Out', 'Cancelled'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual for percentage booked
eventSchema.virtual('percentageBooked').get(function () {
  if (this.totalCapacity === 0) return 0;
  return Math.round(((this.totalCapacity - this.availableSeats) / this.totalCapacity) * 100);
});

module.exports = mongoose.model('Event', eventSchema);
