module.exports = app => {
    const user = require("../controllers/user.controller.js");
    const auth = require("../controllers/auth.controller.js");
  
    var router = require("express").Router();
  
    // Create a new User
    router.post("/", user.create);
  
    // Get all users (for admin panel)
    router.get("/all", user.findAll);
  
    // Get current authenticated user (must be before /:id route)
    router.get("/me", auth.verifyToken, user.getCurrentUser);
  
    // Save shipping info for authenticated user
    router.post("/shipping-info", auth.verifyToken, user.saveShippingInfo);
  
    // Retrieve all published Tutorials
    router.get("/published", user.findAllPublished);
  
    // Retrieve a single Tutorial with id
    router.get("/:id", user.findOne);
  
    // Update a Tutorial with id
    router.put("/:id", user.update);
  
    // Delete a Tutorial with id
    router.delete("/:id", user.delete);
  
    // Delete all Tutorials
    router.delete("/", user.deleteAll);
  
    app.use('/api/users', router);
  };
  