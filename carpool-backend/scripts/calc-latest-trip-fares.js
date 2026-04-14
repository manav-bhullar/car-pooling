const prisma = require('../src/prisma/client');
const { calculateFares } = require('../src/modules/trip/fare.utlis');

async function main(){
  try{
    const trip = await prisma.trip.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        tripStops: { orderBy: { stopOrder: 'asc' } },
        tripUsers: true,
      }
    });

    if(!trip){
      console.error('No trip found');
      process.exit(1);
    }

    const fares = calculateFares(trip.tripUsers, trip.tripStops, { farePerKm: 12, minFare: 20 });
    console.log(JSON.stringify(fares, null, 2));
  }catch(e){
    console.error('Error calculating fares', e.message || e);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
}

main();
