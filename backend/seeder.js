const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');

// Load env vars
dotenv.config();

const connectDB = require('./config/db');

// Seed sample data
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Ticket.deleteMany();
    await Event.deleteMany();
    await User.deleteMany();

    console.log('Creating sample users...');
    // Create Users (passwords will be hashed by User pre-save hook)
    const adminUser = await User.create({
      name: 'Admin Coordinator',
      email: 'admin@sliit.lk',
      password: 'AdminPassword123!',
      role: 'admin',
    });

    const studentUser = await User.create({
      name: 'Kasun Perera',
      email: 'student@sliit.lk',
      password: 'StudentPassword123!',
      role: 'user',
    });

    const organizerUser = await User.create({
      name: 'Nimali Silva',
      email: 'organizer@sliit.lk',
      password: 'OrganizerPassword123!',
      role: 'user',
    });

    console.log('Creating sample events...');
    // Create Events
    const events = await Event.create([
      {
        title: 'SLIIT CyberFest 2026',
        description: 'The annual flagship cyber security, ethical hacking, and tech conference organized by the Faculty of Computing.',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // in 14 days
        venue: 'SLIIT Main Auditorium, Malabe',
        totalCapacity: 150,
        availableSeats: 147,
        ticketPrice: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1280&h=720&fit=crop&q=80',
        status: 'Active',
        createdBy: organizerUser._id,
      },
      {
        title: 'AI & Machine Learning Innovation Summit',
        description: 'Explore generative AI, large language models, computer vision and edge deployment with leading industry experts.',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // in 21 days
        venue: 'Colombo Innovation Hub, Level 4',
        totalCapacity: 80,
        availableSeats: 78,
        ticketPrice: 4500,
        imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1280&h=720&fit=crop&q=80',
        status: 'Active',
        createdBy: adminUser._id,
      },
      {
        title: 'Full Stack React Native & Node.js Masterclass',
        description: 'Hands-on intensive weekend workshop covering scalable REST API development with Express and native mobile development.',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
        venue: 'Virtual Lab Hall A & Zoom',
        totalCapacity: 50,
        availableSeats: 0,
        ticketPrice: 1500,
        imageUrl: 'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=1280&h=720&fit=crop&q=80',
        status: 'Sold Out',
        createdBy: organizerUser._id,
      },
      {
        title: 'National Robotics Championship 2026',
        description: 'Autonomous line followers, combat bots, and IoT robotics exhibition featuring teams from across Sri Lanka.',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // in 30 days
        venue: 'BMICH Exhibition Hall, Colombo 07',
        totalCapacity: 300,
        availableSeats: 300,
        ticketPrice: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1280&h=720&fit=crop&q=80',
        status: 'Active',
        createdBy: adminUser._id,
      },
      {
        title: 'Startup Pitch & Venture Networking Night',
        description: 'Tech startup founders pitch their minimum viable products to angel investors and seed venture capital firms.',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // in 45 days
        venue: 'Hatch Works, 44 Richmond Hill, Colombo',
        totalCapacity: 75,
        availableSeats: 75,
        ticketPrice: 0, // Free event
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1280&h=720&fit=crop&q=80',
        status: 'Active',
        createdBy: organizerUser._id,
      },
    ]);

    console.log('Creating sample tickets & demonstrating business logic...');
    // Create sample tickets for studentUser
    // Ticket 1: 3 seats for CyberFest
    await Ticket.create({
      eventId: events[0]._id,
      userId: studentUser._id,
      ticketQuantity: 3,
      totalAmount: 3 * events[0].ticketPrice,
      status: 'Confirmed',
      bookedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Ticket 2: 2 seats for AI Summit
    await Ticket.create({
      eventId: events[1]._id,
      userId: studentUser._id,
      ticketQuantity: 2,
      totalAmount: 2 * events[1].ticketPrice,
      status: 'Confirmed',
      bookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    console.log('\n=============================================');
    console.log(' Data Seeded Successfully!');
    console.log('=============================================');
    console.log('Sample Accounts Created:');
    console.log('1. Student User:');
    console.log('   Email:    student@sliit.lk');
    console.log('   Password: StudentPassword123!');
    console.log('2. Organizer User:');
    console.log('   Email:    organizer@sliit.lk');
    console.log('   Password: OrganizerPassword123!');
    console.log('3. Admin User:');
    console.log('   Email:    admin@sliit.lk');
    console.log('   Password: AdminPassword123!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

// Destroy all data
const destroyData = async () => {
  try {
    await connectDB();
    await Ticket.deleteMany();
    await Event.deleteMany();
    await User.deleteMany();

    console.log(' All Data Destroyed!');
    process.exit(0);
  } catch (error) {
    console.error(`Error destroying data: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d' || process.argv[2] === '--destroy') {
  destroyData();
} else {
  seedData();
}
