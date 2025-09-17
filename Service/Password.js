import bcrypt from "bcrypt"

export function isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;
    return strongPasswordRegex.test(password);
}

export async function hashPassword(password){
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password,saltRounds);
    return hashPassword;
}