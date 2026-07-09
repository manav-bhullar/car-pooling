const { haversine } = require('./utils');

function calculateDistanceOpt(sequence) {
  let total = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const a = sequence[i];
    const b = sequence[i + 1];
    total += haversine(a.lat, a.lng, b.lat, b.lng);
  }
  return total;
}

const reqs = [];
for (let i = 0; i < 8; i++) {
  reqs.push({
    userId: `req-${i}`,
    lat: 30.0 + Math.random() * 0.1,
    lng: 76.0 + Math.random() * 0.1,
  });
}

const start2 = process.hrtime();
for (let i = 0; i < 50000; i++) {
    calculateDistanceOpt(reqs);
}
const end2 = process.hrtime(start2);
console.log(`calculateDistanceOpt: ${end2[0]}s ${end2[1] / 1000000}ms`);
