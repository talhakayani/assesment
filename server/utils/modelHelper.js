const { getStorageMode } = require('../config/database.js');
const { 
  userStore, 
  appointmentStore, 
  reportStore, 
  aiAnalysisStore,
  populate,
  populateMany 
} = require('../storage/inMemoryStore.js');
const User = require('../models/User.js');
const Appointment = require('../models/Appointment.js');
const Report = require('../models/Report.js');
const AIAnalysis = require('../models/AIAnalysis.js');

// Stats cache (5 min TTL) — cleared when a user is created
const CACHE_TTL = 5 * 60 * 1000;
const statsCache = {};

const getCachedStats = (key) => {
  const cached = statsCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedStats = (key, data) => {
  statsCache[key] = { data, timestamp: Date.now() };
};

const clearStatsCache = () => {
  Object.keys(statsCache).forEach((key) => delete statsCache[key]);
};

// Helper to get the appropriate model/store
const getUserModel = () => {
  const model = getStorageMode() ? userStore : User;
  const originalCreate = model.create.bind(model);

  model.create = async (...args) => {
    const user = await originalCreate(...args);
    clearStatsCache();
    return user;
  };

  return model;
};

const getAppointmentModel = () => {
  return getStorageMode() ? appointmentStore : Appointment;
};

const getReportModel = () => {
  return getStorageMode() ? reportStore : Report;
};

const getAIAnalysisModel = () => {
  return getStorageMode() ? aiAnalysisStore : AIAnalysis;
};

// Helper to populate references
const populateReference = async (doc, fields) => {
  const useInMemory = getStorageMode();
  
  if (useInMemory) {
    return populate(doc, fields);
  } else {
    if (doc && typeof doc.populate === 'function') {
      return doc.populate(fields.join(' '));
    }
    return doc;
  }
};

const populateReferences = async (docs, fields) => {
  const useInMemory = getStorageMode();
  
  if (useInMemory) {
    return populateMany(docs, fields);
  } else {
    // MongoDB handles population in query
    return docs;
  }
};

// Helper to handle select('+password') for in-memory
const findUserWithPassword = async (query) => {
  const useInMemory = getStorageMode();
  
  if (useInMemory) {
    return userStore.findOne(query);
  } else {
    return User.findOne(query).select('+password');
  }
};

module.exports = {
  getUserModel,
  getAppointmentModel,
  getReportModel,
  getAIAnalysisModel,
  populateReference,
  populateReferences,
  findUserWithPassword,
  getCachedStats,
  setCachedStats,
  clearStatsCache
};
