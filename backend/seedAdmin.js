require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Pricing = require('./models/Pricing');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-star-view');
  
  // Create admin
  const existingAdmin = await User.findOne({ username: 'admin' });
  if (!existingAdmin) {
    await User.create({ username: 'admin', password: 'Admin@123', role: 'admin', name: 'Admin User' });
    console.log('Admin created: admin / Admin@123');
  }

  // Create manager
  const existingManager = await User.findOne({ username: 'manager1' });
  if (!existingManager) {
    await User.create({ username: 'manager1', password: 'Manager@123', role: 'manager', name: 'Reception Manager' });
    console.log('Manager created: manager1 / Manager@123');
  }

  // Create leaser
  const existingLeaser = await User.findOne({ username: 'leaser1' });
  if (!existingLeaser) {
    await User.create({ username: 'leaser1', password: 'Leaser@123', role: 'leaser', name: 'Property Leaser' });
    console.log('Leaser created: leaser1 / Leaser@123');
  }

  // Create sample rooms
  const roomsData = [
    { roomNumber: 'A1', roomType: 'Deluxe', floor: 'Ground', basePrice: 2500, status: 'vacant' },
    { roomNumber: 'A2', roomType: 'Deluxe', floor: 'Ground', basePrice: 2500, status: 'vacant' },
    { roomNumber: 'A3', roomType: 'Normal', floor: 'Ground', basePrice: 1500, status: 'vacant' },
    { roomNumber: 'B1', roomType: 'Suite', floor: 'First', basePrice: 4500, status: 'vacant' },
    { roomNumber: 'B2', roomType: 'Normal', floor: 'First', basePrice: 1500, status: 'vacant' },
    { roomNumber: 'B3', roomType: 'Super Deluxe', floor: 'First', basePrice: 3500, status: 'vacant' },
    { roomNumber: 'C1', roomType: 'Standard', floor: 'Second', basePrice: 1200, status: 'vacant' },
    { roomNumber: 'C2', roomType: 'Standard', floor: 'Second', basePrice: 1200, status: 'vacant' },
  ];

  for (const r of roomsData) {
    const exists = await Room.findOne({ roomNumber: r.roomNumber });
    if (!exists) await Room.create(r);
  }
  console.log('Rooms seeded');

  // Seed pricing
  const pricingData = [
    { roomType: 'Standard', price: 1200 },
    { roomType: 'Normal', price: 1500 },
    { roomType: 'Deluxe', price: 2500 },
    { roomType: 'Super Deluxe', price: 3500 },
    { roomType: 'Suite', price: 4500 },
  ];
  for (const p of pricingData) {
    await Pricing.findOneAndUpdate({ roomType: p.roomType }, p, { upsert: true });
  }
  console.log('Pricing seeded');

  console.log('\n✅ Seed complete! You can now run: npm run dev');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
