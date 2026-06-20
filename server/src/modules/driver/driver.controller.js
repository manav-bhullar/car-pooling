const driverService = require('./driver.service');
const { success, error } = require('../../utils/response');

exports.getAvailableTrips = async (req, res) => {
  try {
    const trips = await driverService.getAvailableTrips();
    return success(res, trips);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.acceptTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverTrip = await driverService.acceptTrip(req.userId, tripId);
    return success(res, driverTrip);
  } catch (err) {
    return error(res, err.message, err.code || 500);
  }
};

exports.startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverTrip = await driverService.startTrip(req.userId, tripId);
    return success(res, driverTrip);
  } catch (err) {
    return error(res, err.message, err.code || 500);
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const driverTrip = await driverService.completeTrip(req.userId, tripId);
    return success(res, driverTrip);
  } catch (err) {
    return error(res, err.message, err.code || 500);
  }
};

exports.getCurrentTrip = async (req, res) => {
  try {
    const trip = await driverService.getCurrentTrip(req.userId);
    return success(res, trip);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
