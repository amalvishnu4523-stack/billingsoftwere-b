import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true },
    companyName: String,
    contactPerson: String,
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    gstin: String,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentTerms: String,
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supplierSchema.index({ isDeleted: 1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
