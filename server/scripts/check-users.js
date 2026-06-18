const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { email: true, isVerified: true, password: true } })
  .then(users => {
    users.forEach(u => console.log(u.email, '| verified:', u.isVerified, '| hasPassword:', !!u.password));
    return p.$disconnect();
  })
  .catch(e => { console.error(e.message); return p.$disconnect(); });
