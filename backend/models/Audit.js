const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    sourceBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    destinationBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    affectedBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    itemName: { type: String },
    itemDetails: { type: mongoose.Schema.Types.Mixed },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ action: 1 });
auditSchema.index({ user: 1 });
auditSchema.index({ branch: 1 });
auditSchema.index({ affectedBranches: 1 });

module.exports = mongoose.model("Audit", auditSchema);
