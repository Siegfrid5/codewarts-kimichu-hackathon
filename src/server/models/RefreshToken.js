/**
 * GABAYANI — Refresh Token Model
 * 
 * Manages refresh tokens for session management.
 * Supports token rotation and revocation.
 */

const crypto = require('crypto');
const db = require('../db');

const TABLE = 'refresh_tokens';

const RefreshToken = {
  /**
   * Generate a secure random refresh token.
   * @returns {string} 64-byte hex string
   */
  generateToken() {
    return crypto.randomBytes(64).toString('hex');
  },

  /**
   * Hash a refresh token for storage.
   * @param {string} token
   * @returns {string} SHA-256 hash
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Create a new refresh token for a user.
   * @param {string} userId
   * @param {number} expiresInDays - Default 7 days
   * @returns {Object} Created refresh token row with plaintext token
   */
  async create(userId, expiresInDays = 7) {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [refreshToken] = await db(TABLE)
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .returning('*');

    return { ...refreshToken, token };
  },

  /**
   * Find a refresh token by its hash.
   * @param {string} token
   * @returns {Object|null}
   */
  async findByToken(token) {
    const tokenHash = this.hashToken(token);
    return db(TABLE).where({ token_hash: tokenHash }).first();
  },

  /**
   * Revoke a refresh token.
   * @param {string} token
   */
  async revoke(token) {
    const tokenHash = this.hashToken(token);
    await db(TABLE)
      .where({ token_hash: tokenHash })
      .update({ revoked_at: db.fn.now() });
  },

  /**
   * Revoke all refresh tokens for a user.
   * @param {string} userId
   */
  async revokeAllForUser(userId) {
    await db(TABLE)
      .where({ user_id: userId })
      .update({ revoked_at: db.fn.now() });
  },

  /**
   * Clean up expired and revoked tokens.
   * Should be run periodically (e.g., daily).
   */
  async cleanupExpired() {
    await db(TABLE)
      .where('expires_at', '<', db.fn.now())
      .orWhere('revoked_at', 'is not null')
      .del();
  },

  /**
   * Verify if a refresh token is valid.
   * @param {string} token
   * @returns {Object|null} Valid token or null
   */
  async verify(token) {
    const refreshToken = await this.findByToken(token);
    
    if (!refreshToken) {
      return null;
    }

    if (refreshToken.revoked_at) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(refreshToken.expires_at);
    
    if (expiresAt < now) {
      return null;
    }

    return refreshToken;
  },
};

module.exports = RefreshToken;
