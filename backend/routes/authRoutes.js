const express = require("express");

const router =
  express.Router();

const {
  registerUser,
  loginUser,
} = require(
  "../controllers/authController"
);

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );

const roleMiddleware =
  require(
    "../middleware/roleMiddleware"
  );

/** router.post(
  "/register",
  authMiddleware,
  roleMiddleware("manager"),
  registerUser
); */

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

module.exports = router;