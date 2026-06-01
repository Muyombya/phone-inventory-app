const Audit =
  require("../models/Audit");

const logAudit =
  async ({
    user,
    branch,
    action,
    entityType,
    entityId,
    description,
  }) => {
    try {
      await Audit.create({
        user,
        branch,
        action,
        entityType,
        entityId,
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