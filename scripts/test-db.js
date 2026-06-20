const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT 1 as ok`.then(r => {
  console.log('DB OK:', r);
  p.$disconnect();
}).catch(e => {
  console.error('ERR:', e.message);
  p.$disconnect();
});