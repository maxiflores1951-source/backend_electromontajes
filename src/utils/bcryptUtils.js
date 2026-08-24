const bcrypt = require('bcrypt');

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, 10);
};

module.exports = { comparePassword, hashPassword };
