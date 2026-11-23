import mongoose from 'mongoose';

const purchaseReceiptItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderedQty: { type: Number, required: true },
    receivedQty: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    receiptDate: { type: Date, default: Date.now },
    supplierInvoiceNumber: String,
    items: [purchaseReceiptItemSchema],
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    paidAmount: { type: Number, default: 0 },
    notes: String,
    isProcessed: { type: Boolean, default: false },
    processedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PurchaseReceipt = mongoose.model('PurchaseReceipt', purchaseReceiptSchema);
