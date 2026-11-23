import mongoose from 'mongoose';

const businessSettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: 'My Shop' },
    logo: { type: String },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    phone: String,
    email: String,
    gstin: String,
    invoicePrefix: { type: String, default: 'INV' },
    invoiceCounter: { type: Number, default: 1 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    taxEnabled: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 18 },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    igstRate: { type: Number, default: 18 },
    roundingMethod: {
      type: String,
      enum: ['none', 'up', 'down', 'nearest'],
      default: 'nearest',
    },
    lowStockDefault: { type: Number, default: 10 },
  },
  { timestamps: true }
);

businessSettingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const BusinessSettings = mongoose.model('BusinessSettings', businessSettingsSchema);
