const db = require("../models");
const Brand = db.brands;
const Op = db.Sequelize.Op;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Get the root directory
const rootDir = path.dirname(require.main.filename);

// Define upload directory relative to the project root
const uploadDir = path.join(rootDir, "app", "assets", "brand");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
}).single("logo");

// Create and Save a new Brand
exports.create = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                return res.status(400).send({ message: err.message || "Logo upload failed." });
            }

            if (!req.body.name) {
                return res.status(400).send({ message: "Name is required!" });
            }

            const name = req.body.name;
            const slug = req.body.slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            let logoPath = "/assets/brand/default-brand.png";
            if (req.file) {
                logoPath = "/assets/brand/" + req.file.filename;
            }

            const brand = {
                name: name,
                slug: slug,
                logo: logoPath,
                description: req.body.description || "",
                isActive: req.body.isActive !== undefined ? req.body.isActive : true
            };

            const data = await Brand.create(brand);
            res.send(data);
        } catch (error) {
            res.status(500).send({
                message: error.message || "Some error occurred while creating the Brand."
            });
        }
    });
};

// Retrieve all Brands
exports.findAll = async (req, res) => {
    try {
        const name = req.query.name;
        let condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

        const data = await Brand.findAll({ where: condition, order: [['name', 'ASC']] });
        res.send(data);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving brands."
        });
    }
};

// Find a single Brand with id
exports.findOne = async (req, res) => {
    const id = req.params.id;

    try {
        const data = await Brand.findByPk(id);
        if (data) {
            res.send(data);
        } else {
            res.status(404).send({ message: `Cannot find Brand with id=${id}.` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error retrieving Brand with id=" + id });
    }
};

// Update a Brand
exports.update = (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                return res.status(400).send({ message: err.message || "Logo upload failed." });
            }

            const id = req.params.id;
            const updates = { ...req.body };

            if (req.file) {
                // Delete old logo if it exists and is not default
                const oldBrand = await Brand.findByPk(id);
                if (oldBrand && oldBrand.logo && !oldBrand.logo.includes('default-brand.png')) {
                    const oldLogoPath = path.join(uploadDir, path.basename(oldBrand.logo));
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlinkSync(oldLogoPath);
                    }
                }
                updates.logo = "/assets/brand/" + req.file.filename;
            }

            const [updated] = await Brand.update(updates, { where: { id: id } });

            if (updated) {
                const updatedBrand = await Brand.findByPk(id);
                res.send({ message: "Brand was updated successfully.", brand: updatedBrand });
            } else {
                res.status(404).send({ message: `Cannot update Brand with id=${id}. Maybe not found!` });
            }
        } catch (err) {
            res.status(500).send({ message: "Error updating Brand with id=" + req.params.id });
        }
    });
};

// Delete a Brand
exports.delete = async (req, res) => {
    const id = req.params.id;

    try {
        const brand = await Brand.findByPk(id);
        if (!brand) {
            return res.status(404).send({ message: `Brand with id=${id} not found.` });
        }

        // Check for associated products
        const productCount = await db.products.count({ where: { brand_id: id } });
        if (productCount > 0) {
            return res.status(400).send({ message: "Cannot delete brand with associated products." });
        }

        // Delete logo file
        if (brand.logo && !brand.logo.includes('default-brand.png')) {
            const logoPath = path.join(uploadDir, path.basename(brand.logo));
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        }

        const deleted = await Brand.destroy({ where: { id: id } });
        if (deleted) {
            res.send({ message: "Brand was deleted successfully!" });
        } else {
            res.status(404).send({ message: `Cannot delete Brand with id=${id}.` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete Brand with id=" + id });
    }
};
