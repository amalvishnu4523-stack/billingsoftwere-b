import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    barcode: String,
    category: { type: String, trim: true },
    subcategory: String,
    brand: String,
    modelNumber: String,
    description: String,
    unit: {
      type: String,
      enum: ['piece', 'pair', 'box', 'kg', 'meter', 'liter', 'set', 'roll'],
      default: 'piece',
    },
    purchaseCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    minSellingPrice: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    hsnCode: String,
    currentStock: { type: Number, default: 0 },
    minStockThreshold: { type: Number, default: 10 },
    color: { type: String, trim: true },
    location: String,
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ barcode: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', brand: 'text', modelNumber: 'text' });

export const Product = mongoose.model('Product', productSchema);
