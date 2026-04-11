const db = require("../models");
const Artist = db.artists;
const Op = db.Sequelize.Op;
const cloudinary = require('../config/cloudinary');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Зөвхөн зураг файл оруулах боломжтой!'));
    }
  }
}).single("image");

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    // Convert buffer to data URI
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: 'artists',
        transformation: [
          { width: 800, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
};

// Create and Save a new Artist
exports.create = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).send({ 
          success: false,
          message: err.message || "Зураг оруулахад алдаа гарлаа." 
        });
      }

      if (!req.body.name) {
        return res.status(400).send({ 
          success: false,
          message: "Нэр шаардлагатай!" 
        });
      }

      let imageUrl = null;
      if (req.file) {
        try {
          imageUrl = await uploadToCloudinary(req.file);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).send({
            success: false,
            message: "Зураг оруулахад алдаа гарлаа."
          });
        }
      }

      const artistData = {
        name: req.body.name,
        nameMn: req.body.nameMn || req.body.name,
        image: imageUrl,
        bio: req.body.bio || null,
        bioMn: req.body.bioMn || req.body.bio || null,
        phone: req.body.phone || null,
        email: req.body.email || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        location: req.body.location || null,
        category: req.body.category || null,
        title: req.body.title || null,
        productsCount: req.body.productsCount ? parseInt(req.body.productsCount) : 0,
        yearsExperience: req.body.yearsExperience ? parseInt(req.body.yearsExperience) : 0,
        happyCustomers: req.body.happyCustomers ? parseInt(req.body.happyCustomers) : 0,
      };

      const artist = await Artist.create(artistData);
      
      res.send({
        success: true,
        message: "Урлаач амжилттай үүсгэгдлээ.",
        data: artist
      });
    } catch (error) {
      console.error("Error creating artist:", error);
      res.status(500).send({
        success: false,
        message: error.message || "Урлаач үүсгэхэд алдаа гарлаа.",
      });
    }
  });
};

// Retrieve all Artists
exports.findAll = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nameMn: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const artists = await Artist.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.send({
      success: true,
      data: artists,
      total: artists.length
    });
  } catch (err) {
    console.error("Error retrieving artists:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Урлаачдын мэдээлэл авахад алдаа гарлаа.",
    });
  }
};

// Find a single Artist by id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const artist = await Artist.findByPk(id);

    if (artist) {
      res.send({
        success: true,
        data: artist
      });
    } else {
      res.status(404).send({
        success: false,
        message: `ID=${id} урлаач олдсонгүй.`,
      });
    }
  } catch (err) {
    console.error("Error retrieving artist:", err);
    res.status(500).send({
      success: false,
      message: "Урлаач олоход алдаа гарлаа: " + req.params.id,
    });
  }
};

// Update a Artist by the id in the request
exports.update = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Image upload error:", err);
        return res.status(400).send({ 
          success: false,
          message: err.message || "Зураг оруулахад алдаа гарлаа." 
        });
      }

      const id = req.params.id;

      // Get existing artist
      const artist = await Artist.findByPk(id);
      if (!artist) {
        return res.status(404).send({
          success: false,
          message: `ID=${id} урлаач олдсонгүй.`,
        });
      }

      // Prepare updates
      const updates = {};
      
      if (req.body.name !== undefined) {
        updates.name = req.body.name;
      }
      
      if (req.body.nameMn !== undefined) {
        updates.nameMn = req.body.nameMn;
      }
      
      if (req.body.bio !== undefined) {
        updates.bio = req.body.bio;
      }
      
      if (req.body.bioMn !== undefined) {
        updates.bioMn = req.body.bioMn;
      }
      
      if (req.body.phone !== undefined) {
        updates.phone = req.body.phone;
      }
      
      if (req.body.email !== undefined) {
        updates.email = req.body.email;
      }
      
      if (req.body.isActive !== undefined) {
        updates.isActive = req.body.isActive;
      }
      
      if (req.body.location !== undefined) {
        updates.location = req.body.location;
      }
      
      if (req.body.category !== undefined) {
        updates.category = req.body.category;
      }
      
      if (req.body.title !== undefined) {
        updates.title = req.body.title;
      }
      
      if (req.body.productsCount !== undefined) {
        updates.productsCount = parseInt(req.body.productsCount) || 0;
      }
      
      if (req.body.yearsExperience !== undefined) {
        updates.yearsExperience = parseInt(req.body.yearsExperience) || 0;
      }
      
      if (req.body.happyCustomers !== undefined) {
        updates.happyCustomers = parseInt(req.body.happyCustomers) || 0;
      }

      // Handle image upload
      if (req.file) {
        try {
          const imageUrl = await uploadToCloudinary(req.file);
          updates.image = imageUrl;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).send({
            success: false,
            message: "Зураг оруулахад алдаа гарлаа."
          });
        }
      }

      await Artist.update(updates, {
        where: { id: id },
      });

      const updatedArtist = await Artist.findByPk(id);

      res.send({
        success: true,
        message: "Урлаач амжилттай шинэчлэгдлээ.",
        data: updatedArtist
      });
    } catch (err) {
      console.error("Error updating artist:", err);
      res.status(500).send({
        success: false,
        message: "Урлаач шинэчлэхэд алдаа гарлаа: " + req.params.id,
      });
    }
  });
};

// Delete a Artist with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Artist.destroy({
      where: { id: id },
    });

    if (deleted) {
      res.send({
        success: true,
        message: "Урлаач амжилттай устгагдлаа!"
      });
    } else {
      res.status(404).send({
        success: false,
        message: `ID=${id} урлаач олдсонгүй.`,
      });
    }
  } catch (err) {
    console.error("Error deleting artist:", err);
    res.status(500).send({
      success: false,
      message: "Урлаач устгахад алдаа гарлаа: " + req.params.id,
    });
  }
};

// Delete all Artists
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await Artist.destroy({
      where: {},
      truncate: false,
    });

    res.send({
      success: true,
      message: `${deleted} урлаач амжилттай устгагдлаа.`,
    });
  } catch (err) {
    console.error("Error deleting all artists:", err);
    res.status(500).send({
      success: false,
      message: err.message || "Бүх урлаач устгахад алдаа гарлаа.",
    });
  }
};

