module.exports = app => {
  const artistReviews = require("../controllers/artist_review.controller");
  const auth = require("../controllers/auth.controller");

  var router = require("express").Router();

  // Create a new Artist Review (requires auth)
  router.post("/", auth.verifyToken, artistReviews.create);

  // Retrieve all Reviews for a specific artist
  router.get("/artist/:artistId", artistReviews.findAll);

  // Retrieve all Reviews (for admin)
  router.get("/", artistReviews.findAllReviews);

  // Retrieve a single Review with id
  router.get("/:id", artistReviews.findOne);

  // Update a Review with id (admin only)
  router.put("/:id", auth.verifyToken, artistReviews.update);
  router.patch("/:id", auth.verifyToken, artistReviews.update);

  // Delete a Review with id (admin only)
  router.delete("/:id", auth.verifyToken, artistReviews.delete);

  // Mark review as helpful
  router.post("/:id/helpful", artistReviews.markHelpful);

  // Get reviews by user
  router.get("/user/:userId", artistReviews.findByUser);

  app.use('/api/artist-reviews', router);
};

