const bcrypt = require('bcrypt');

async function generateHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Hashed Password:', hashedPassword);
}

generateHash('Maxking12@'); 
