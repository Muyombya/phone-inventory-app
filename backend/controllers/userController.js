const User = require("../models/User");

const Branch = require("../models/Branch");

// =========================
// GET USERS
// =========================
const getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find()
        .populate(
          "branch",
          "name"
        )
        .select(
          "-password"
        )
        .sort({
          createdAt: -1,
        });

    res.json(users);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Server error",
    });
  }
};

// =========================
// UPDATE USER
// =========================
const updateUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    const {
      username,
      password,
      role,
      branch,
    } = req.body;

    // =====================
    // VALIDATE ROLE
    // =====================
    const allowedRoles = [
      "manager",
      "cashier",
      "branch-user",
    ];

    if (
      role &&
      !allowedRoles.includes(
        role
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid role selected",
        });
    }

    // =====================
    // VALIDATE BRANCH
    // =====================
    if (branch) {
  const branchExists =
    await Branch.findById(
      branch
    );

  if (!branchExists) {
    return res
      .status(400)
      .json({
        message:
          "Branch not found",
      });
  }
}

      if (
        !branchExists
      ) {
        return res
          .status(400)
          .json({
            message:
              "Branch not found",
          });
      }
    }

    // =====================
    // UPDATE USER
    // =====================
    user.username =
      username ||
      user.username;

    user.role =
      role ||
      user.role;

    if (branch) {
  user.branch =
    branch;
}

    // =====================
    // UPDATE PASSWORD
    // =====================
    if (
      password &&
      password.trim() !== ""
    ) {
      user.password =
        password;
    }

    const updatedUser =
      await user.save();

    const populatedUser =
      await User.findById(
        updatedUser._id
      )
        .populate(
          "branch",
          "name"
        )
        .select(
          "-password"
        );

    res.json({
      message:
        "User updated successfully",

      user: populatedUser,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Server error",
    });
  }
};

// =========================
// DELETE USER
// =========================
const deleteUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found",
        });
    }

    // =====================
    // PREVENT SELF DELETE
    // =====================
    if (
      user._id.toString() ===
      req.user.id
    ) {
      return res
        .status(400)
        .json({
          message:
            "You cannot delete your own account",
        });
    }

    await user.deleteOne();

    res.json({
      message:
        "User deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message:
        "Server error",
    });
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
};