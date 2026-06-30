const Audit =
  require("../models/Audit");

const logAudit = async ({
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

  session = null,
}) => {

  const auditData = {

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
  };

  if (session) {

    await Audit.create(
      [auditData],
      { session }
    );

    return;
  }

  await Audit.create(auditData);

};

module.exports =
  logAudit;