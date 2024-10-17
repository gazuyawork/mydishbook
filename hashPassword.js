const bcrypt = require('bcryptjs');

const passwords = ['admin123', 'paid123', 'free123'];

passwords.forEach(password => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log(`Original: ${password}, Hashed: ${hashedPassword}`);
});
