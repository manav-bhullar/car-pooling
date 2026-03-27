import * as rideRequestService from './rideRequest.service.js';

export const createRideRequest = async (req, res) => {
  try {
    const result = await rideRequestService.createRideRequest(req.body);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};