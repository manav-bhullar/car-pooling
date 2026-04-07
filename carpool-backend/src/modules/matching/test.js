const { runMatchingBatch } = require('./matchingEngine');

const users = [
  {
    id: "A",
    pickupLat: 30,
    pickupLng: 76,
    dropLat: 31,
    dropLng: 76,
    preferredTime: new Date('2026-04-07T10:00:00Z'),
  },
  {
    id: "B",
    pickupLat: 30.1,
    pickupLng: 76,
    dropLat: 31.1,
    dropLng: 76,
    preferredTime: new Date('2026-04-07T10:05:00Z'),
  },
  {
    id: "C",
    pickupLat: 30.2,
    pickupLng: 76,
    dropLat: 31.2,
    dropLng: 76,
    preferredTime: new Date('2026-04-07T10:02:00Z'),
  },
  {
    id: "D",
    pickupLat: 35,
    pickupLng: 80,
    dropLat: 36,
    dropLng: 80,
    preferredTime: new Date('2026-04-07T14:00:00Z'),
  },
];

console.log(JSON.stringify(runMatchingBatch(users), null, 2));