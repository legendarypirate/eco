const db = require("../models");
const Setting = db.settings;

// Fetch all settings (should only be one row)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();

        // If no settings exist, create default
        if (!settings) {
            settings = await Setting.create({});
        }

        res.send(settings);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving settings."
        });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) {
            // If no ID provided, try to find the only settings row
            const existing = await Setting.findOne();
            if (existing) {
                await existing.update(req.body);
                return res.send(existing);
            } else {
                const created = await Setting.create(req.body);
                return res.send(created);
            }
        }

        const [num] = await Setting.update(req.body, {
            where: { id: id }
        });

        if (num == 1) {
            const updated = await Setting.findByPk(id);
            res.send(updated);
        } else {
            res.send({
                message: `Cannot update settings with id=${id}. Maybe settings was not found or req.body is empty!`
            });
        }
    } catch (err) {
        res.status(500).send({
            message: "Error updating settings with id=" + req.body.id
        });
    }
};
