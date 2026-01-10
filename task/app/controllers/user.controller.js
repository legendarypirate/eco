const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;
const bcrypt = require('bcryptjs');
const saltRounds = 10; // Number of salt rounds for bcrypt

// Create and Save a new User
exports.create = async (req, res) => {
  // Log request origin/IP (super useful for CORS debugging)
  console.log("📥 Incoming request to /auth/create");
  console.log("➡️ Origin:", req.headers.origin);
  console.log("➡️ IP:", req.ip);

  // Log incoming body (hide password)
  console.log("➡️ Body received:", {
    email: req.body.email,
    phone: req.body.phone,
    full_name: req.body.full_name,
    password: req.body.password ? "***HIDDEN***" : null
  });

  // Basic validation
  if (!req.body.password) {
    console.log("❌ Validation failed — missing password");
    return res.status(400).send({ message: "Password is required!" });
  }

  if (!req.body.full_name) {
    console.log("❌ Validation failed — missing full_name");
    return res.status(400).send({ message: "Full name is required!" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    console.log("🔐 Password hashed successfully");

    // User object - build with required fields
    const user = {
      full_name: req.body.full_name,
      role: req.body.role || 'customer', // Use provided role or default to 'customer'
      password: hashedPassword
    };

    // Only add email if provided and not empty
    if (req.body.email && typeof req.body.email === 'string' && req.body.email.trim() !== '') {
      user.email = req.body.email.trim();
    }

    // Only add phone if provided and not empty
    if (req.body.phone && typeof req.body.phone === 'string' && req.body.phone.trim() !== '') {
      user.phone = req.body.phone.trim();
    }

    console.log("📝 User object prepared:", {
      ...user,
      password: "***HASHED***"
    });

    // Save to DB
    const data = await User.create(user);

    console.log("✅ User created successfully:", {
      id: data.id,
      full_name: data.full_name,
      role: data.role
    });

    // Return user data without password
    const userResponse = data.toJSON ? data.toJSON() : data;
    delete userResponse.password;

    res.json({
      success: true,
      message: "User created successfully",
      data: userResponse
    });

  } catch (err) {
    console.error("🔥 Error during user creation:", err);
    console.error("🔥 Error name:", err.name);
    console.error("🔥 Error message:", err.message);
    console.error("🔥 Error stack:", err.stack);
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const validationErrors = err.errors.map(e => e.message).join(', ');
      return res.status(400).send({
        message: `Validation error: ${validationErrors}`,
        errors: err.errors
      });
    }
    
    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path || 'field';
      return res.status(400).send({
        message: `${field} already exists. Please use a different value.`,
        errors: err.errors
      });
    }
    
    // Handle database constraint errors
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(400).send({
        message: `Database error: ${err.message}`,
        original: err.original?.message || err.message
      });
    }

    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
      error: err.name || 'UnknownError'
    });
  }
};


exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: User,
        as: 'supervisor',
        attributes: ['id', 'full_name', 'role'], // Only include needed fields
        required: false // Left join instead of inner join
      }],
      order: [['id', 'DESC']] // Order by id in descending order
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    // If the include fails due to type mismatch, try without it
    if (error.message && error.message.includes('operator does not exist')) {
      try {
        console.log("Retrying without supervisor include due to type mismatch...");
        const users = await User.findAll({
          order: [['id', 'DESC']]
        });
        return res.json({
          success: true,
          data: users
        });
      } catch (retryError) {
        console.error("Error on retry:", retryError);
      }
    }
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};
// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id
      });
    });
};

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  // Prepare the data for updating - include ALL fields
  const updateData = {
    full_name: req.body.full_name,
    phone: req.body.phone,
    role: req.body.role,
    supervisor_id: req.body.supervisor_id !== undefined ? req.body.supervisor_id : null,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  try {
    // Check if the user exists before updating
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with id=${id} not found.`
      });
    }

    console.log("Existing user data:", existingUser);
    console.log("Incoming request data:", req.body);
    console.log("Prepared update data:", updateData);

    // Check if password is provided and needs updating
    if (req.body.password && req.body.password.trim() !== '') {
      // Hash the password before updating
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updateData.password = hashedPassword;
    }

    // Update the user
    const [num] = await User.update(updateData, { where: { id: id } });

    console.log('Number of affected rows:', num);

    if (num === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made. The data might already be the same."
      });
    }

    // Fetch the updated user data
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    // Return the response with the updated user data
    res.json({
      success: true,
      message: "User was updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);

    // Return a structured error response
    res.status(500).json({
      success: false,
      message: `Error updating User with id=${id}`,
      error: err.message,
    });
  }
};

// Delete a User with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await User.destroy({
      where: { id: id }
    });
    
    if (num == 1) {
      res.json({
        success: true,
        message: "User was deleted successfully!"
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Cannot delete User with id=${id}. Maybe User was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not delete User with id=" + id,
      error: err.message
    });
  }
};

// Delete all User from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} User were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all User."
      });
    });
};

// find all published User
exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving User."
      });
    });
};

// Get current authenticated user
// This should be used with auth.verifyToken middleware
exports.getCurrentUser = (req, res) => {
  try {
    // req.user is set by auth.verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    // Prepare user response (exclude sensitive fields)
    const userObj = req.user.toJSON ? req.user.toJSON() : req.user;
    delete userObj.password;
    delete userObj.refresh_token;
    delete userObj.reset_password_token;
    delete userObj.reset_password_expires;
    delete userObj.email_verification_token;

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа',
      error: error.message
    });
  }
};

// Save or update shipping info for authenticated user
exports.saveShippingInfo = async (req, res) => {
  try {
    // req.user is set by auth.verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    const userId = req.user.id;
    const shippingInfo = req.body;

    // Update user with shipping information
    // Note: Since we don't have dedicated shipping fields in the user model,
    // we'll store it as JSON in a text field or update existing fields
    const updateData = {
      first_name: shippingInfo.firstName || shippingInfo.first_name || null,
      last_name: shippingInfo.lastName || shippingInfo.last_name || null,
      phone: shippingInfo.phone || null,
      email: shippingInfo.email || null,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await User.update(updateData, { where: { id: userId } });

    // Fetch updated user
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: "Хүргэлтийн мэдээлэл амжилттай хадгалагдлаа",
      user: updatedUser,
      shippingInfo: shippingInfo
    });
  } catch (error) {
    console.error('Save shipping info error:', error);
    res.status(500).json({
      success: false,
      message: 'Хүргэлтийн мэдээлэл хадгалахад алдаа гарлаа',
      error: error.message
    });
  }
};
