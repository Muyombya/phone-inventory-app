const jwt =
  require("jsonwebtoken");

const User =
  require("../models/User");

const Branch =
  require("../models/Branch");


// =========================
// GENERATE TOKEN
// =========================
const generateToken =
  (id) => {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET,
      {
        expiresIn:
          "30d",
      }
    );
  };


// =========================
// REGISTER USER
// =========================
const registerUser =
  async (
    req,
    res
  ) => {
    try {
      const {
        username,
        password,
        role,
        branch,
      } = req.body;

      // =====================
      // CHECK EXISTING USER
      // =====================
      const existingUser =
        await User.findOne({
          username,
        });

      if (
        existingUser
      ) {
        return res
          .status(400)
          .json({
            message:
              "User already exists",
          });
      }

      // =====================
      // VALIDATE BRANCH
      // =====================
      let assignedBranch =
        null;

      if (
        role !==
          "manager" &&
        branch
      ) {
        assignedBranch =
          await Branch.findById(
            branch
          );

        if (
          !assignedBranch
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid branch selected",
            });
        }
      }

      // =====================
      // CREATE USER
      // =====================
      const user =
        await User.create({
          username,
          password,
          role,
          branch:
            role ===
            "manager"
              ? null
              : branch,
        });

      res
        .status(201)
        .json({
          message:
            "User registered successfully",

          user: {
            _id:
              user._id,

            username:
              user.username,

            role:
              user.role,

            branch:
              assignedBranch,
          },
        });
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Error registering user",

          error:
            error.message,
        });
    }
  };


// =========================
// LOGIN USER
// =========================
const loginUser =
  async (
    req,
    res
  ) => {
    try {
      const {
        username,
        password,
      } = req.body;

      console.log(
        "LOGIN ATTEMPT:",
        username
      );

      // =====================
      // FIND USER
      // =====================
      const user =
        await User.findOne({
          username,
        }).populate(
          "branch",
          "name"
        );

      console.log(
        "USER FOUND:",
        user
          ? user.username
          : "NO USER"
      );

      if (!user) {
        return res
          .status(400)
          .json({
            message:
               "USER NOT FOUND",
          });
      }

      // =====================
      // CHECK PASSWORD
      // =====================
      console.log(
                    "USERNAME:",
                    username
                  );

      const isMatch =
        await user.comparePassword(
          password
        );

      console.log(
                    "PASSWORD MATCH:",
                    isMatch
                  );

      if (
        !isMatch
      ) {
        return res
          .status(400)
          .json({
            message:
              "PASSWORD MISMATCH",
          });
      }

      // =====================
      // RETURN USER
      // =====================
      res.json({
        token:
          generateToken(
            user._id
          ),

        user: {
          _id:
            user._id,

          username:
            user.username,

          role:
            user.role,

          branch:
            user.branch,
        },
      });
    } catch (error) {
      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Error logging in",

          error:
            error.message,
        });
    }
  };


// =========================
// EXPORTS
// =========================
module.exports = {
  registerUser,
  loginUser,
};