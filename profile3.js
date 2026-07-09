const { optimizeRoute } = require('./server/src/modules/matching/route');

function generateRequests(count) {
  const requests = [];
  for (let i = 0; i < count; i++) {
    requests.push({
      id: `req-${i}`,
      userId: `user-${i}`,
      pickupLat: 30.0 + Math.random() * 0.1,
      pickupLng: 76.0 + Math.random() * 0.1,
      dropLat: 30.1 + Math.random() * 0.1,
      dropLng: 76.1 + Math.random() * 0.1,
    });
  }
  return requests;
}

const reqs = generateRequests(4);

const start = process.hrtime();
for (let i = 0; i < 5000; i++) {
    optimizeRoute(reqs);
}
const end = process.hrtime(start);
console.log(`optimizeRoute: ${end[0]}s ${end[1] / 1000000}ms`);
