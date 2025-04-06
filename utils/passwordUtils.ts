import { hash as _hash, verify } from "argon2";

const passwordUtils = {
    /**
     * Hashes a password using Argon2.
     *
     * @param {string} password - The password to hash.
     * @returns {Promise<string>} A promise that resolves with the password hash.
     * @throws {Error} If there is an error while hashing the password.
     */
    async hashPassword(password: string): Promise<string> {
        try {
            return await _hash(password);
        } catch {
            throw new Error("Error hashing password");
        }
    },

    /**
     * Verifies a password against a hash using Argon2.
     *
     * @param {string} hash - The hash to verify against.
     * @param {string} password - The password to verify.
     * @returns {Promise<boolean>} A promise that resolves with true if the
     * password matches the hash, or false if not.
     * @throws {Error} If there is an error while verifying the password.
     */
    async verifyPassword(hash: string, password: string): Promise<boolean> {
        try {
            return await verify(hash, password);
        } catch {
            throw new Error("Error verifying password");
        }
    },
};

export default passwordUtils;
