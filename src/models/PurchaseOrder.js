import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    receivedQty: { type: Number, default: 0 },
    unitCost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: Date,
    items: [purchaseOrderItemSchema],
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled', 'returned'],
      default: 'draft',
    },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
