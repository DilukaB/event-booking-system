const Event = require('../models/Event');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// ─── Helper: Determine image URL ─────────────────────────────────────────────
// Cloudinary gives req.file.path = full https URL
// Disk gives req.file.path = local absolute path → we store the /uploads relative URL
const getImageUrl = (file) => {
  if (!file) return null;
  // Cloudinary: path is already an https URL
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  // Disk storage: build a relative URL the static server can serve
  const filename = path.basename(file.path);
  return `/uploads/${filename}`;
};

// ─── Helper: Delete image if stored locally ──────────────────────────────────
const deleteLocalImage = (imageUrl) => {
  try {
    if (!imageUrl || imageUrl.startsWith('http')) return; // Cloudinary or null
    const filename = imageUrl.replace('/uploads/', '');
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (err) {
    console.warn('Failed to delete local image:', err.message);
  }
};

// ─── Helper: Delete image from Cloudinary ───────────────────────────────────
const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary')) return;
    const cloudinary = require('cloudinary').v2;
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${filename}`);
  } catch (err) {
    console.warn('Failed to delete old Cloudinary image:', err.message);
  }
};

// ─── Helper: Delete image (any storage) ─────────────────────────────────────
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  if (imageUrl.includes('cloudinary')) {
    await deleteCloudinaryImage(imageUrl);
  } else {
    deleteLocalImage(imageUrl);
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) await deleteImage(getImageUrl(req.file));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, date, venue, totalCapacity, ticketPrice, status } = req.body;
    const capacity = parseInt(totalCapacity, 10);
    const imageUrl = getImageUrl(req.file);

    const event = await Event.create({
      title,
      description,
      date,
      venue,
      totalCapacity: capacity,
      availableSeats: capacity,
      ticketPrice: parseFloat(ticketPrice),
      imageUrl,
      status: status || 'Active',
      createdBy: req.user._id,
    });

    await event.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    if (req.file) await deleteImage(getImageUrl(req.file));
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) await deleteImage(getImageUrl(req.file));
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      if (req.file) await deleteImage(getImageUrl(req.file));
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Authorization: only creator or admin can update
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      if (req.file) await deleteImage(getImageUrl(req.file));
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const { title, description, date, venue, totalCapacity, ticketPrice, status } = req.body;

    // Handle capacity change
    if (totalCapacity) {
      const newCapacity = parseInt(totalCapacity, 10);
      const bookedSeats = event.totalCapacity - event.availableSeats;
      const newAvailable = newCapacity - bookedSeats;
      if (newAvailable < 0) {
        if (req.file) await deleteImage(getImageUrl(req.file));
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity below number of booked seats (${bookedSeats})`,
        });
      }
      event.totalCapacity = newCapacity;
      event.availableSeats = newAvailable;
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (venue) event.venue = venue;
    if (ticketPrice !== undefined) event.ticketPrice = parseFloat(ticketPrice);
    if (status) event.status = status;

    // Update image if new file uploaded
    if (req.file) {
      // Delete old image (Cloudinary or local)
      if (event.imageUrl) await deleteImage(event.imageUrl);
      event.imageUrl = getImageUrl(req.file);
    }

    const updatedEvent = await event.save();
    await updatedEvent.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    if (req.file) await deleteImage(getImageUrl(req.file));
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    // Delete associated image (Cloudinary or local)
    if (event.imageUrl) await deleteImage(event.imageUrl);

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent };
