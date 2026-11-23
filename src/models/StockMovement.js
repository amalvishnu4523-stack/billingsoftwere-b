import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    movementType: {
      type: String,
      enum: [
        'purchase_receipt',
        'sale',
        'customer_return',
        'supplier_return',
        'stock_adjustment',
        'opening_stock',
        'damaged',
        'transfer',
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceType: String,
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    reason: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
