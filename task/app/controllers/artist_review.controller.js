const db = require("../models");
const ArtistReview = db.artist_reviews;
const Artist = db.artists;
const Op = db.Sequelize.Op;

// Create and Save a new Artist Review
exports.create = async (req, res) => {
  try {
    // Get user from authenticated request (set by auth.verifyToken middleware)
    if (!req.user) {
      return res.status(401).send({
        success: false,
        message: "Authentication required!"
      });
    }

    // Validate request
    if (!req.body.artistId || !req.body.rating || !req.body.comment) {
      return res.status(400).send({
        success: false,
        message: "Artist ID, rating, and comment are required!"
      });
    }

    // Check if artist exists
    const artist = await Artist.findByPk(req.body.artistId);
    if (!artist) {
      return res.status(404).send({
        success: false,
        message: "Artist not found!"
      });
    }

    // Check if user already reviewed this artist
    const existingReview = await ArtistReview.findOne({
      where: {
        artistId: req.body.artistId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).send({
        success: false,
        message: "You have already reviewed this artist!"
      });
    }

    // Create a Review
    const review = {
      artistId: req.body.artistId,
      userId: req.user.id,
      userName: req.body.userName || req.user.full_name || 'Хэрэглэгч',
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
      images: req.body.images || [],
      isApproved: req.body.isApproved !== undefined ? req.body.isApproved : true
    };

    // Save Review in the database
    const data = await ArtistReview.create(review);

    res.send({
      success: true,
      message: "Review created successfully.",
      data: data
    });
  } catch (err) {
    console.error("Error creating artist review:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while creating the Review."
    });
  }
};

// Retrieve all Reviews for an artist
exports.findAll = async (req, res) => {
  try {
    const artistId = req.params.artistId;
    const { rating, isApproved, sortBy = 'newest' } = req.query;
    
    const where = { artistId: artistId };
    
    if (rating) where.rating = rating;
    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }
    
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'helpful') order = [['helpfulCount', 'DESC']];
    if (sortBy === 'rating_desc') order = [['rating', 'DESC']];
    if (sortBy === 'rating_asc') order = [['rating', 'ASC']];

    const reviews = await ArtistReview.findAll({
      where,
      order,
      include: [{ model: db.users, as: 'user' }]
    });

    res.send({
      success: true,
      data: reviews,
      total: reviews.length
    });
  } catch (err) {
    console.error("Error retrieving artist reviews:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving reviews."
    });
  }
};

// Retrieve all Reviews (for admin)
exports.findAllReviews = async (req, res) => {
  try {
    const { artistId, rating, isApproved, search, sortBy = 'newest' } = req.query;
    
    const where = {};
    
    if (artistId) where.artistId = artistId;
    if (rating) where.rating = rating;
    if (isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }
    if (search) {
      where[Op.or] = [
        { userName: { [Op.like]: `%${search}%` } },
        { comment: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } }
      ];
    }
    
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'helpful') order = [['helpfulCount', 'DESC']];
    if (sortBy === 'rating_desc') order = [['rating', 'DESC']];
    if (sortBy === 'rating_asc') order = [['rating', 'ASC']];

    const reviews = await ArtistReview.findAll({
      where,
      order,
      include: [
        { model: db.artists, as: 'artist' },
        { model: db.users, as: 'user' }
      ]
    });

    res.send({
      success: true,
      data: reviews,
      total: reviews.length
    });
  } catch (err) {
    console.error("Error retrieving all artist reviews:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving reviews."
    });
  }
};

// Find a single Review with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const review = await ArtistReview.findByPk(id, {
      include: [
        { model: db.artists, as: 'artist' },
        { model: db.users, as: 'user' }
      ]
    });

    if (review) {
      res.send({
        success: true,
        data: review
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Cannot find Review with id=${id}.`
      });
    }
  } catch (err) {
    console.error("Error retrieving artist review:", err);
    res.status(500).send({
      success: false,
      message: "Error retrieving Review with id=" + req.params.id
    });
  }
};

// Update a Review by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await ArtistReview.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedReview = await ArtistReview.findByPk(id, {
        include: [
          { model: db.artists, as: 'artist' },
          { model: db.users, as: 'user' }
        ]
      });
      
      res.send({
        success: true,
        message: "Review was updated successfully.",
        data: updatedReview
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Cannot update Review with id=${id}. Maybe Review was not found!`
      });
    }
  } catch (err) {
    console.error("Error updating artist review:", err);
    res.status(500).send({
      success: false,
      message: "Error updating Review with id=" + req.params.id
    });
  }
};

// Delete a Review with id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await ArtistReview.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        success: true,
        message: "Review was deleted successfully!"
      });
    } else {
      res.status(404).send({
        success: false,
        message: `Review with id=${id} not found.`
      });
    }
  } catch (err) {
    console.error("Error deleting artist review:", err);
    res.status(500).send({
      success: false,
      message: "Could not delete Review with id=" + req.params.id
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const id = req.params.id;
    
    const review = await ArtistReview.findByPk(id);
    if (!review) {
      return res.status(404).send({
        success: false,
        message: `Review with id=${id} not found.`
      });
    }

    await ArtistReview.update({
      helpfulCount: review.helpfulCount + 1
    }, {
      where: { id: id }
    });

    const updatedReview = await ArtistReview.findByPk(id);
    res.send({
      success: true,
      message: "Review marked as helpful.",
      data: updatedReview
    });
  } catch (err) {
    console.error("Error marking review as helpful:", err);
    res.status(500).send({
      success: false,
      message: "Error marking review as helpful."
    });
  }
};

// Get reviews by user
exports.findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const reviews = await ArtistReview.findAll({
      where: { userId: userId },
      include: [{ model: db.artists, as: 'artist' }],
      order: [['createdAt', 'DESC']]
    });

    res.send({
      success: true,
      data: reviews
    });
  } catch (err) {
    console.error("Error retrieving user artist reviews:", err);
    res.status(500).send({
      success: false,
      message: err.message || `Error retrieving reviews for user ${req.params.userId}`
    });
  }
};

