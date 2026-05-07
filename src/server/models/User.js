/**
 * GABAYANI — User Model
 * 
 * CRUD operations for the `users` table.
 * Handles authentication-related queries (findByPhone, findByUsername, findByEmail for login).
 * Supports account lockout and password management.
 */

const db = require('../db');

const TABLE = 'users';

const User = {
  /**
   * Create a new user.
   * @param {Object} data - { name, phone, username, email, password_hash, subscription_tier }
   * @returns {Object} The created user row
   */
  async create(data) {
    const [user] = await db(TABLE)
      .insert({
        name: data.name,
        phone: data.phone,
        username: data.username || null,
        email: data.email || null,
        password_hash: data.password_hash,
        subscription_tier: data.subscription_tier || 'freemium',
        password_changed_at: db.fn.now(),
      })
      .returning('*');
    return user;
  },

  /**
   * Find a user by phone number (login identifier).
   * @param {string} phone
   * @returns {Object|null}
   */
  async findByPhone(phone) {
    return db(TABLE).where({ phone }).first();
  },

  /**
   * Find a user by username.
   * @param {string} username
   * @returns {Object|null}
   */
  async findByUsername(username) {
    return db(TABLE).where({ username }).first();
  },

  /**
   * Find a user by email.
   * @param {string} email
   * @returns {Object|null}
   */
  async findByEmail(email) {
    return db(TABLE).where({ email }).first();
  },

  /**
   * Find a user by username, email, or phone (flexible login).
   * @param {string} identifier - username, email, or phone
   * @returns {Object|null}
   */
  async findByIdentifier(identifier) {
    return db(TABLE)
      .where(function() {
        this.where('username', identifier)
          .orWhere('email', identifier)
          .orWhere('phone', identifier);
      })
      .first();
  },

  /**
   * Find a user by ID.
   * @param {string} id - UUID
   * @returns {Object|null}
   */
  async findById(id) {
    return db(TABLE).where({ id }).first();
  },

  /**
   * Update a user's subscription tier.
   * @param {string} id - UUID
   * @param {string} tier - 'freemium' or 'subscribed'
   * @returns {Object} Updated user row
   */
  async updateSubscription(id, tier) {
    const [user] = await db(TABLE)
      .where({ id })
      .update({
        subscription_tier: tier,
        subscribed_at: tier === 'subscribed' ? db.fn.now() : null,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return user;
  },

  /**
   * Update last login timestamp.
   * @param {string} id - UUID
   */
  async updateLastLogin(id) {
    await db(TABLE)
      .where({ id })
      .update({ last_login_at: db.fn.now() });
  },

  /**
   * Increment failed login attempts.
   * @param {string} id - UUID
   * @returns {Object} Updated user row
   */
  async incrementFailedLogin(id) {
    const [user] = await db(TABLE)
      .where({ id })
      .increment('failed_login_attempts', 1)
      .returning('*');
    return user;
  },

  /**
   * Reset failed login attempts.
   * @param {string} id - UUID
   */
  async resetFailedLogin(id) {
    await db(TABLE)
      .where({ id })
      .update({ failed_login_attempts: 0, account_locked_until: null });
  },

  /**
   * Lock user account.
   * @param {string} id - UUID
   * @param {Date} lockedUntil - When to unlock
   */
  async lockAccount(id, lockedUntil) {
    await db(TABLE)
      .where({ id })
      .update({ account_locked_until: lockedUntil });
  },

  /**
   * Check if account is locked.
   * @param {string} id - UUID
   * @returns {boolean}
   */
  async isAccountLocked(id) {
    const user = await db(TABLE).where({ id }).first();
    if (!user || !user.account_locked_until) return false;
    
    const now = new Date();
    const lockedUntil = new Date(user.account_locked_until);
    return lockedUntil > now;
  },

  /**
   * Update password.
   * @param {string} id - UUID
   * @param {string} password_hash - New password hash
   */
  async updatePassword(id, password_hash) {
    await db(TABLE)
      .where({ id })
      .update({ 
        password_hash,
        password_changed_at: db.fn.now(),
        failed_login_attempts: 0,
        account_locked_until: null,
      });
  },

  /**
   * Delete a user by ID.
   * @param {string} id - UUID
   */
  async delete(id) {
    await db(TABLE).where({ id }).del();
  },
};

module.exports = User;
