import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, index: true },
    email: { type: String, lowercase: true, trim: true },
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    gstin: String,
    customerType: {
      type: String,
      enum: ['retail', 'wholesale', 'business'],
      default: 'retail',
    },
    creditLimit: { type: Number, default: 0 },
    paymentTerms: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

customerSchema.index({ isDeleted: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
