/**
 * GABAYANI — User Model
 * 
 * CRUD operations for the `users` table.
 * Handles authentication-related queries (findByPhone for login).
 */

const db = require('../db');

const TABLE = 'users';

const User = {
  /**
   * Create a new user.
   * @param {Object} data - { name, phone, password_hash }
   * @returns {Object} The created user row
   */
  async create(data) {
    const [user] = await db(TABLE)
      .insert({
        name: data.name,
        phone: data.phone,
        password_hash: data.password_hash,
        subscription_tier: data.subscription_tier || 'freemium',
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
};

module.exports = User;
