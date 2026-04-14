const FARE_PER_KM = 12; // Example fare per kilometer

const MIN_FARE = 20; // Minimum fare for any trip

function calculateFares(users, stops){
    const fare = {};

    for(const user of users){
        fare[user.rideRequestId] = 0;
    }

    
}