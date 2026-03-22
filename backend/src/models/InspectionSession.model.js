/**
 * models/InspectionSession.model.js — Mongoose schema for an inspection session.
 *
 * Every field maps directly to the InspectionResult type used on the frontend.
 */

const { Schema, model } = require('mongoose');

const BoundingBoxSchema = new Schema({
  x:      { type: Number, required: true },
  y:      { type: Number, required: true },
  width:  { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const DetectedItemSchema = new Schema({
  label:       { type: String, required: true },
  confidence:  { type: Number, required: true, min: 0, max: 1 },
  boundingBox: { type: BoundingBoxSchema, required: true },
}, { _id: false });

const DamageSchema = new Schema({
  type:        { type: String, enum: ['scratch','dent','crack','stain','unknown'], required: true },
  severity:    { type: String, enum: ['minor','moderate','severe'], required: true },
  confidence:  { type: Number, required: true, min: 0, max: 1 },
  boundingBox: { type: BoundingBoxSchema, required: true },
}, { _id: false });

const MoneySchema = new Schema({
  min:      Number,
  max:      Number,
  newPrice: Number,
  currentPrice: Number,
  currency: { type: String, default: 'USD' },
}, { _id: false });

const InspectionSessionSchema = new Schema({
  sessionId:            { type: String, required: true, unique: true, index: true },
  item:                 { type: DetectedItemSchema, required: true },
  damages:              { type: [DamageSchema], default: [] },
  itemAgeYears:         { type: Number, default: 0 },
  repairCost:           { type: MoneySchema },
  marketPrice:          { type: MoneySchema },
  suggestedResalePrice: { type: Number, default: 0 },
  reportUrl:            { type: String },
}, {
  timestamps: true,   // adds createdAt + updatedAt
});

module.exports = model('InspectionSession', InspectionSessionSchema);
