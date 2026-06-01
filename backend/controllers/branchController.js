const Branch =
  require("../models/Branch");



// =====================================
// GET ALL BRANCHES
// =====================================
const getBranches =
  async (req, res) => {
    try {
      const branches =
        await Branch.find().sort({
          createdAt: -1,
        });

      res.json(branches);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// GET SINGLE BRANCH
// =====================================
const getBranchById =
  async (req, res) => {
    try {
      const branch =
        await Branch.findById(
          req.params.id
        );

      if (!branch) {
        return res
          .status(404)
          .json({
            message:
              "Branch not found",
          });
      }

      res.json(branch);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// CREATE BRANCH
// =====================================
const createBranch =
  async (req, res) => {
    try {
      const {
        name,
        location,
        contact,
      } = req.body;

      const existingBranch =
        await Branch.findOne({
          name,
        });

      if (existingBranch) {
        return res
          .status(400)
          .json({
            message:
              "Branch already exists",
          });
      }

     const branch =
  await Branch.create({
    name,
    location,
    contact,
  });

      res.status(201).json(
        branch
      );
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// UPDATE BRANCH
// =====================================
const updateBranch =
  async (req, res) => {
    try {
      const branch =
        await Branch.findById(
          req.params.id
        );

      if (!branch) {
        return res
          .status(404)
          .json({
            message:
              "Branch not found",
          });
      }

      branch.name =
        req.body.name ||
        branch.name;

      branch.location =
        req.body.location ||
        branch.location;

      branch.contact =
         req.body.contact ||
        branch.contact;

      const updatedBranch =
        await branch.save();

      res.json(
        updatedBranch
      );
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// DELETE BRANCH
// =====================================
const deleteBranch =
  async (req, res) => {
    try {
      const branch =
        await Branch.findById(
          req.params.id
        );

      if (!branch) {
        return res
          .status(404)
          .json({
            message:
              "Branch not found",
          });
      }

      await branch.deleteOne();

      res.json({
        message:
          "Branch deleted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };



// =====================================
// EXPORTS
// =====================================
module.exports = {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
};