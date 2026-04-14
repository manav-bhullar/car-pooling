const prisma = require('../src/prisma/client');

async function main(){
  const tripId = '4368cf97-60a1-4572-9590-45e4b8c24893';
  try{
    console.log('Deleting TripStops for', tripId);
    await prisma.tripStop.deleteMany({ where: { tripId } });
    console.log('Deleting TripUsers for', tripId);
    await prisma.tripUser.deleteMany({ where: { tripId } });
    console.log('Deleting Trip record', tripId);
    await prisma.trip.delete({ where: { id: tripId } }).catch(()=>{});
    console.log('Cleanup complete');
  }catch(e){
    console.error('cleanup error', e.message || e);
  }finally{
    await prisma.$disconnect();
  }
}

main();
