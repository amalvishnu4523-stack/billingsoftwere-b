import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, trim: true },
    paymentType: {
      type: String,
      enum: ['customer_receipt', 'supplier_payment', 'refund'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['customer', 'supplier'],
      required: true,
    },
    entity: { type: mongoose.Schema.Types.ObjectId, required: true },
    relatedDocument: { type: mongoose.Schema.Types.ObjectId },
    relatedDocumentType: String,
    amount: { type: Number, required: true },
    paymentMethod: String,
    reference: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
