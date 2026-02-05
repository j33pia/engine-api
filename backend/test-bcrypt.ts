import * as bcrypt from 'bcrypt';

async function main() {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated Hash:', hash);

    const match = await bcrypt.compare(password, hash);
    console.log('Self-Check Match:', match);

    // Hardcoded hash from seed (if seed was deterministic, but bcrypt has salt)
    // We can't check seed hash unless we fetch from DB.
}

main();
