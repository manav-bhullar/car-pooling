import express from 'express';
import { createRideRequest } from './rideRequest.controller.js';

const router = express.Router();

router.post('/', createRideRequest);

export default router;