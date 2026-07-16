import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  ZoneSchemaDefinition,
  CrowdAlertSchemaDefinition,
  IncidentSchemaDefinition,
  VenueInfoSchemaDefinition
} from './models.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
let useMock = false;

// Mock database system
class MockModel {
  static _dataMap = new Map();

  constructor(modelName, data = {}) {
    this._modelName = modelName;
    Object.assign(this, data);
    if (!this._id) {
      this._id = Math.random().toString(36).substring(2, 11);
    }
    if (!this.timestamp && !this.createdAt) {
      this.timestamp = new Date();
    }
  }

  async save() {
    const list = MockModel._getList(this._modelName);
    const index = list.findIndex(item => item._id === this._id);
    const plainObject = { ...this };
    delete plainObject._modelName;
    if (index >= 0) {
      list[index] = plainObject;
    } else {
      list.push(plainObject);
    }
    MockModel._saveList(this._modelName, list);
    return this;
  }

  static _getFilePath(modelName) {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, `${modelName.toLowerCase()}.json`);
  }

  static _getList(modelName) {
    if (this._dataMap.has(modelName)) {
      return this._dataMap.get(modelName);
    }
    const filePath = this._getFilePath(modelName);
    let list = [];
    if (fs.existsSync(filePath)) {
      try {
        list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.error(`Error reading mock db file for ${modelName}:`, e);
      }
    }
    this._dataMap.set(modelName, list);
    return list;
  }

  static _saveList(modelName, list) {
    this._dataMap.set(modelName, list);
    const filePath = this._getFilePath(modelName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error writing mock db file for ${modelName}:`, e);
    }
  }
}

export function createMockModelClass(modelName) {
  return class extends MockModel {
    constructor(data) {
      super(modelName, data);
    }

    static async find(query = {}) {
      const list = MockModel._getList(modelName);
      return list.filter(item => {
        for (let key in query) {
          const val = query[key];
          if (val && typeof val === 'object') {
            if (val.$in && Array.isArray(val.$in)) {
              if (!val.$in.includes(item[key])) return false;
            } else if (val.$gte !== undefined) {
              if (!(item[key] >= val.$gte)) return false;
            } else if (val.$lte !== undefined) {
              if (!(item[key] <= val.$lte)) return false;
            }
          } else if (item[key] !== val) {
            return false;
          }
        }
        return true;
      }).map(item => new this(item));
    }

    static async findOne(query = {}) {
      const results = await this.find(query);
      return results[0] || null;
    }

    static async findOneAndUpdate(query, update, options = {}) {
      const list = MockModel._getList(modelName);
      let index = list.findIndex(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });

      let doc;
      const updateData = update.$set || update;
      
      if (index >= 0) {
        list[index] = { ...list[index], ...updateData };
        doc = list[index];
      } else if (options.upsert) {
        doc = { _id: Math.random().toString(36).substring(2, 11), ...query, ...updateData };
        if (!doc.timestamp) doc.timestamp = new Date();
        list.push(doc);
      } else {
        return null;
      }
      
      MockModel._saveList(modelName, list);
      return new this(doc);
    }

    static async create(doc) {
      const instance = new this(doc);
      await instance.save();
      return instance;
    }

    static async updateMany(query, update) {
      const list = MockModel._getList(modelName);
      let modifiedCount = 0;
      const updateData = update.$set || update;
      const updatedList = list.map(item => {
        let match = true;
        for (let key in query) {
          if (item[key] !== query[key]) match = false;
        }
        if (match) {
          modifiedCount++;
          return { ...item, ...updateData };
        }
        return item;
      });
      if (modifiedCount > 0) {
        MockModel._saveList(modelName, updatedList);
      }
      return { modifiedCount };
    }

    static async deleteMany(query = {}) {
      const list = MockModel._getList(modelName);
      const filtered = list.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return true;
        }
        return false;
      });
      MockModel._saveList(modelName, filtered);
      return { deletedCount: list.length - filtered.length };
    }
  };
}

let Zone;
let CrowdAlert;
let Incident;
let VenueInfo;

// Initialize connection and models
export async function connectDB() {
  if (MONGO_URI) {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(MONGO_URI);
      console.log('[32m[Database] Connected to MongoDB database successfully.[0m');
      
      // Compile real Mongoose models
      Zone = mongoose.model('Zone', new mongoose.Schema(ZoneSchemaDefinition));
      CrowdAlert = mongoose.model('CrowdAlert', new mongoose.Schema(CrowdAlertSchemaDefinition));
      Incident = mongoose.model('Incident', new mongoose.Schema(IncidentSchemaDefinition));
      VenueInfo = mongoose.model('VenueInfo', new mongoose.Schema(VenueInfoSchemaDefinition));
      
      useMock = false;
      return true;
    } catch (err) {
      console.error('[31m[Database] Failed to connect to MongoDB. Falling back to local mock DB.[0m', err.message);
      setupMockModels();
      return false;
    }
  } else {
    console.log('[33m[Database] No MONGO_URI provided in env. Initializing local JSON database.[0m');
    setupMockModels();
    return false;
  }
}

function setupMockModels() {
  Zone = createMockModelClass('Zone');
  CrowdAlert = createMockModelClass('CrowdAlert');
  Incident = createMockModelClass('Incident');
  VenueInfo = createMockModelClass('VenueInfo');
  useMock = true;
}

export { Zone, CrowdAlert, Incident, VenueInfo, useMock };
