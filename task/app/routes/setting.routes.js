module.exports = app => {
    const settings = require("../controllers/setting.controller.js");
    const auth = require("../controllers/auth.controller.js");
    var router = require("express").Router();

    // Retrieve existing settings
    router.get("/", settings.getSettings);

    // Update settings (Only accessible to authenticated users/admins in a real app)
    // For now, making it public to ease development, but we should add auth.verifyToken if needed
    router.put("/", settings.updateSettings);

    app.use('/api/settings', router);
};
