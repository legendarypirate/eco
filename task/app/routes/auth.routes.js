// routes/auth.routes.js
module.exports = app => {
  const auth = require("../controllers/auth.controller");

  var router = require("express").Router();

  // Mongolian Phone Auth
  router.post("/register", auth.register);
  router.post("/login", auth.login);

  // Google OAuth
  router.get("/google", auth.googleAuth);
  router.get("/google/callback", auth.googleCallback);

  // Facebook OAuth
  router.post("/facebook", auth.facebookAuth);
  router.get("/facebook/callback", auth.facebookCallback);

  // Token management
  router.post("/refresh-token", auth.refreshToken);

  // Protected routes
  router.get("/me", auth.verifyToken, auth.getCurrentUser);
  router.put("/profile", auth.verifyToken, auth.updateProfile);
  router.put("/change-password", auth.verifyToken, auth.changePassword);
  router.post("/logout", auth.verifyToken, auth.logout);

  // Token verification test
  router.get("/verify", auth.verifyToken, (req, res) => {
    res.json({ 
      success: true, 
      message: "Токен хүчинтэй байна",
      user: {
        id: req.user.id,
        phone: req.user.phone,
        role: req.user.role
      }
    });
  });

  app.use("/api/auth", router);
};