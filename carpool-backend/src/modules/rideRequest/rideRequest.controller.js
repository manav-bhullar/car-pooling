const service = require('./rideRequest.service');
const { success, error } = require('../../utils/response');
const { validateCreateRideRequest } = require('./rideRequest.validator');

exports.create = async(req, res) =>{
    try{
        const  validationError = validateCreateRideRequest(req.body);
        if(validationError){
            return error(res, validationError);
        }
        const userId = req.userId;

        const result = await service.createRideRequest(userId, req.body);
        return success(res, result, 201);
    } catch (err) {
        console.error(err);
        return error(res, err.message || "Internal Server Error", err.status || 500);
    }
}

exports.getAll = async(req,res) =>{
    try{
        const userId = req.userId;
        const {status} = req.query;

        const data = await service.getRideRequests(userId, status);

        return success(res, data);
    }catch(err){
        console.error(err);
        return error(res, err.message || "Internal Server Error", 500);
    }
};

exports.getCurrent = async(req,res) => {
    try {
        const userId = req.userId;

        const data = await service.getCurrentRideRequest(userId);
        return success(res, data);
    } catch (err) {
        console.error(err);
        return error(res, err.message || 'Internal Server Error', 500);
    }
};

exports.cancel = async(req, res) => {
    try{
        const userId = req.userId;
        const {id} = req.params;

        const data = await service.cancelRideRequest(id, userId);
        return success(res, data);
    }catch(err){
        return error(res, err.message)
    }
};