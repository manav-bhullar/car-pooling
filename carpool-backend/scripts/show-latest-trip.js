const prisma = require('../src/prisma/client');

async function main(){
  try{
    const trip = await prisma.trip.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { tripStops: true, tripUsers: true },
    });
    console.log(JSON.stringify(trip, null, 2));
  }catch(e){
    console.error('err', e.message || e);
  }finally{
    await prisma.$disconnect();
  }
}

main();
