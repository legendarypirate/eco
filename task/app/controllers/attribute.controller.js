const db = require("../models");
const Attribute = db.attributes;

// Create and Save a new Attribute
exports.create = async (req, res) => {
    try {
        if (!req.body.name || !req.body.nameMn) {
            return res.status(400).send({ message: "Name and Mongolian Name are required!" });
        }

        const attribute = {
            name: req.body.name,
            nameMn: req.body.nameMn,
            values: req.body.values
        };

        const data = await Attribute.create(attribute);
        res.send(data);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error creating attribute." });
    }
};

// Retrieve all Attributes
exports.findAll = async (req, res) => {
    try {
        const data = await Attribute.findAll({
            order: [['name_mn', 'ASC']]
        });
        res.send(data);
    } catch (err) {
        res.status(500).send({ message: err.message || "Error retrieving attributes." });
    }
};

// Find a single Attribute with an id
exports.findOne = async (req, res) => {
    try {
        const data = await Attribute.findByPk(req.params.id);
        if (data) {
            res.send(data);
        } else {
            res.status(404).send({ message: `Attribute with id=${req.params.id} not found.` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error retrieving attribute." });
    }
};

// Update an Attribute by the id in the request
exports.update = async (req, res) => {
    try {
        const [num] = await Attribute.update(req.body, {
            where: { id: req.params.id }
        });

        if (num == 1) {
            const updated = await Attribute.findByPk(req.params.id);
            res.send(updated);
        } else {
            res.send({ message: `Cannot update Attribute with id=${req.params.id}.` });
        }
    } catch (err) {
        res.status(500).send({ message: "Error updating attribute." });
    }
};

// Delete an Attribute with the specified id in the request
exports.delete = async (req, res) => {
    try {
        const num = await Attribute.destroy({
            where: { id: req.params.id }
        });

        if (num == 1) {
            res.send({ message: "Attribute was deleted successfully!" });
        } else {
            res.send({ message: `Cannot delete Attribute with id=${req.params.id}.` });
        }
    } catch (err) {
        res.status(500).send({ message: "Could not delete attribute." });
    }
};
