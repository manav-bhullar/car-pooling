const prisma = require('../src/prisma/client');

async function main(){
  try {
    const ids = ['b0d72cf4-e769-4f8d-9bfe-caf948bde203','4faa8abb-042c-4ecb-917e-6d8968726801','863dd1c7-d607-4939-90ea-efc86b267b3f'];
    const rows = await prisma.tripUser.findMany({ where: { rideRequestId: { in: ids } } });
    console.log(JSON.stringify(rows, null, 2));
  } catch(e){
    console.error('err', e.message || e);
  } finally{
    await prisma.$disconnect();
  }
}

main();
