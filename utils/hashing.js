const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashPassword = async (password) => 
{
    return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (inputPassword, storedPasswordHash) => 

{
    return await bcrypt.compare(inputPassword, storedPasswordHash);
};

module.exports = { hashPassword, comparePassword };
