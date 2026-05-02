const loadEnv = require('../config/loadEnv');
const prisma = require('../prisma/client');

loadEnv();

const initDb = async () => {
  await prisma.$connect();
};

module.exports = {
  prisma,
  initDb,
};
