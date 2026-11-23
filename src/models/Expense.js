import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseDate: { type: Date, required: true },
    category: {
      type: String,
      enum: ['rent', 'salary', 'electricity', 'transport', 'maintenance', 'packaging', 'office', 'other'],
      required: true,
    },
    description: String,
    amount: { type: Number, required: true },
    paymentMethod: String,
    referenceNumber: String,
    attachment: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
