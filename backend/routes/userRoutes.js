const express =
  require("express");

const router =
  express.Router();

const {
  getUsers,
  updateUser,
  deleteUser,
} = require(
  "../controllers/userController"
);

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );



// =========================
// GET USERS
// =========================
router.get(
  "/",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  getUsers
);



// =========================
// UPDATE USER
// =========================
router.put(
  "/:id",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  updateUser
);



// =========================
// DELETE USER
// =========================
router.delete(
  "/:id",
  authMiddleware.protect,
  authMiddleware.managerOnly,
  deleteUser
);



module.exports =
  router;