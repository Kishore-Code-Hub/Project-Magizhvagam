/**
 * MAGIZHVAGAM V4 — Database Abstraction Layer
 * 
 * All new modules use this adapter instead of direct Mongoose calls.
 * When PostgreSQL/Supabase migration occurs, only this file needs to change.
 * 
 * Current backend: MongoDB via Mongoose
 * Future backend:  PostgreSQL via Supabase
 * 
 * Pattern: Repository-style abstraction with find/upsert/history operations
 */

const mongoose = require('mongoose');

// ─── Adapter Mode Detection ─────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'PLACEHOLDER';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'PLACEHOLDER';

const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'PLACEHOLDER' && 
         SUPABASE_URL !== '' && 
         SUPABASE_ANON_KEY !== 'PLACEHOLDER' && 
         SUPABASE_ANON_KEY !== '';
};

const getActiveBackend = () => {
  return isSupabaseConfigured() ? 'supabase' : 'mongodb';
};

// ─── MongoDB Adapter ─────────────────────────────────────────────────────────

class MongoDBAdapter {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find a single document by filter
   * @param {Object} filter - Query filter (e.g. { _id: "active" })
   * @returns {Object|null} Plain JS object or null
   */
  async findOne(filter) {
    const doc = await this.model.findOne(filter).lean();
    return doc || null;
  }

  /**
   * Find multiple documents
   * @param {Object} filter - Query filter
   * @param {Object} options - { sort, limit, skip }
   * @returns {Array} Array of plain JS objects
   */
  async findMany(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.lean();
  }

  /**
   * Upsert a document (insert or update)
   * Used for singleton config documents like site_settings
   * @param {Object} filter - Query filter
   * @param {Object} data - Data to set
   * @returns {Object} Updated document as plain JS object
   */
  async upsert(filter, data) {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return doc;
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Object} Created document as plain JS object
   */
  async create(data) {
    const doc = await this.model.create(data);
    return doc.toObject();
  }

  /**
   * Update a document by filter
   * @param {Object} filter - Query filter
   * @param {Object} data - Fields to update
   * @returns {Object|null} Updated document or null
   */
  async update(filter, data) {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
    return doc;
  }

  /**
   * Delete documents matching filter
   * @param {Object} filter - Query filter
   * @returns {number} Number of deleted documents
   */
  async delete(filter) {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Count documents matching filter
   * @param {Object} filter - Query filter
   * @returns {number}
   */
  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

// ─── Supabase Adapter (Stub — activated when credentials are provided) ──────

class SupabaseAdapter {
  constructor(tableName) {
    this.tableName = tableName;
    this._client = null;
  }

  _getClient() {
    if (this._client) return this._client;
    try {
      // Dynamic import to avoid requiring the module when not in use
      const { createClient } = require('@supabase/supabase-js');
      this._client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return this._client;
    } catch (err) {
      console.warn(`[dbAdapter] Supabase client unavailable: ${err.message}. Falling back to MongoDB.`);
      return null;
    }
  }

  async findOne(filter) {
    const client = this._getClient();
    if (!client) return null;
    
    let query = client.from(this.tableName).select('*');
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key === '_id' ? 'id' : key, value);
    });
    
    const { data, error } = await query.single();
    if (error) return null;
    return data;
  }

  async findMany(filter = {}, options = {}) {
    const client = this._getClient();
    if (!client) return [];
    
    let query = client.from(this.tableName).select('*');
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key === '_id' ? 'id' : key, value);
    });
    
    if (options.sort) {
      const [field, dir] = Object.entries(options.sort)[0];
      query = query.order(field, { ascending: dir === 1 || dir === 'asc' });
    }
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.range(options.skip, options.skip + (options.limit || 50) - 1);
    
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  async upsert(filter, data) {
    const client = this._getClient();
    if (!client) return null;
    
    const id = filter._id || filter.id;
    const payload = { ...data, id: id };
    
    const { data: result, error } = await client
      .from(this.tableName)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    return result;
  }

  async create(data) {
    const client = this._getClient();
    if (!client) return null;
    
    const { data: result, error } = await client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    return result;
  }

  async update(filter, data) {
    const client = this._getClient();
    if (!client) return null;
    
    let query = client.from(this.tableName).update(data);
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key === '_id' ? 'id' : key, value);
    });
    
    const { data: result, error } = await query.select().single();
    if (error) return null;
    return result;
  }

  async delete(filter) {
    const client = this._getClient();
    if (!client) return 0;
    
    let query = client.from(this.tableName).delete();
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key === '_id' ? 'id' : key, value);
    });
    
    const { data, error } = await query.select();
    if (error) return 0;
    return data ? data.length : 0;
  }

  async count(filter = {}) {
    const client = this._getClient();
    if (!client) return 0;
    
    let query = client.from(this.tableName).select('*', { count: 'exact', head: true });
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key === '_id' ? 'id' : key, value);
    });
    
    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  }
}

// ─── Factory: Create the right adapter based on environment ──────────────────

/**
 * Create a database adapter for a given model/table
 * 
 * @param {Object} mongooseModel - The Mongoose model (used when backend is MongoDB)
 * @param {string} tableName - The table name (used when backend is Supabase/PostgreSQL)
 * @returns {MongoDBAdapter|SupabaseAdapter}
 * 
 * @example
 *   const SiteSettings = require('../models/SiteSettings');
 *   const db = createAdapter(SiteSettings, 'site_settings');
 *   const settings = await db.findOne({ _id: 'active' });
 */
function createAdapter(mongooseModel, tableName) {
  const backend = getActiveBackend();
  
  if (backend === 'supabase') {
    console.log(`[dbAdapter] Using Supabase for: ${tableName}`);
    return new SupabaseAdapter(tableName);
  }
  
  return new MongoDBAdapter(mongooseModel);
}

module.exports = {
  createAdapter,
  getActiveBackend,
  isSupabaseConfigured,
  MongoDBAdapter,
  SupabaseAdapter
};
