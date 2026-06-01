const jwt =
  require("jsonwebtoken");

const User =
  require("../models/User");


// =====================================
// PROTECT ROUTES
// =====================================
const protect =
  async (
    req,
    res,
    next
  ) => {
    let token;

    // =========================
    // CHECK TOKEN
    // =========================
    if (
      req.headers
        .authorization &&
      req.headers.authorization.startsWith(
        "Bearer"
      )
    ) {
      try {
        token =
          req.headers.authorization.split(
            " "
          )[1];

        // VERIFY TOKEN
        const decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );

        // GET USER
        req.user =
          await User.findById(
            decoded.id
          )
            .populate(
              "branch"
            )
            .select(
              "-password"
            );

        if (
          !req.user
        ) {
          return res
            .status(
              401
            )
            .json({
              message:
                "User not found",
            });
        }

        next();
      } catch (error) {
        console.log(
          error
        );

        return res
          .status(
            401
          )
          .json({
            message:
              "Not authorized",
          });
      }
    }

    // NO TOKEN
    if (!token) {
      return res
        .status(
          401
        )
        .json({
          message:
            "No token provided",
        });
    }
  };


// =====================================
// MANAGER ONLY
// =====================================
const managerOnly =
  (
    req,
    res,
    next
  ) => {
    if (
      req.user &&
      req.user.role ===
        "manager"
    ) {
      next();
    } else {
      res
        .status(403)
        .json({
          message:
            "Manager access only",
        });
    }
  };


// =====================================
// EXPORTS
// =====================================
module.exports =
  {
    protect,
    managerOnly,
  };