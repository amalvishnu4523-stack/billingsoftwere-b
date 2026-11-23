import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: String,
    entityId: { type: mongoose.Schema.Types.ObjectId },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed },
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
