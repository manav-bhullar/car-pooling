import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = 'http://localhost:5050';

export default function () {
  // 1. Simulate ride request submission
  const requestPayload = JSON.stringify({
    pickupLat: 28.7041,
    pickupLng: 77.1025,
    dropLat: 28.5355,
    dropLng: 77.3910,
    preferredTime: new Date(Date.now() + 30 * 60000).toISOString(),
  });

  const headers = { 'Content-Type': 'application/json' };

  // Note: Needs a valid Bearer token if authentication is enforced. 
  // For a real run, you'd add an auth step or bypass for testing.
  const reqRes = http.post(`${BASE_URL}/api/ride-requests`, requestPayload, { headers });
  
  check(reqRes, {
    'request created or auth required': (r) => r.status === 201 || r.status === 401,
  });

  sleep(1);
}
