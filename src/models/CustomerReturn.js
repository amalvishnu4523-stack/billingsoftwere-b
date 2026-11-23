import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema(
  {
    saleItem: { type: mongoose.Schema.Types.ObjectId, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    returnReason: String,
    condition: {
      type: String,
      enum: ['resellable', 'damaged', 'supplier_return'],
      required: true,
    },
  },
  { _id: false }
);

const customerReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, trim: true },
    originalSale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    returnDate: { type: Date, default: Date.now },
    items: [returnItemSchema],
    totalRefund: { type: Number, default: 0 },
    refundMethod: String,
    refundStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected', 'completed'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CustomerReturn = mongoose.model('CustomerReturn', customerReturnSchema);
