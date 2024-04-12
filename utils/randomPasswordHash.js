const bcrypt = require('bcrypt');

const randomPasswordHash = async () => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numericChars = '0123456789';
    const specialChars = '!@%#$&*';

    let password = '';

    // Ensure at least one character from each category
    password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numericChars[Math.floor(Math.random() * numericChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest of the password with random characters
    for (let i = 4; i < 8; i++) {
        const charSet = uppercaseChars + lowercaseChars + numericChars + specialChars;
        password += charSet[Math.floor(Math.random() * charSet.length)];
    }

    // Shuffle the password to randomize the positions of characters
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    const hash = await bcrypt.hash(password, 12);

    return { password, hash };
}

module.exports = randomPasswordHash;