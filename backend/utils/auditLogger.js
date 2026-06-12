const Audit =
  require("../models/Audit");

const logAudit =
  async ({
    user,
    branch,

    sourceBranch,
    destinationBranch,
    affectedBranches,

    action,
    entityType,
    entityId,
    itemName,
    description,
  }) => {
    try {
      await Audit.create({
  user,
  branch,

  sourceBranch,
  destinationBranch,
  affectedBranches,

  action,
  entityType,
  entityId,
  itemName,
  description,
});
    } catch (
      error
    ) {
      console.log(
        "Audit Error:",
        error.message
      );
    }
  };

module.exports =
  logAudit;