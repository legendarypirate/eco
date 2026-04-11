module.exports = app => {
    const attributes = require("../controllers/attribute.controller");
    var router = require("express").Router();

    router.post("/", attributes.create);
    router.get("/", attributes.findAll);
    router.get("/:id", attributes.findOne);
    router.put("/:id", attributes.update);
    router.delete("/:id", attributes.delete);

    app.use('/api/attributes', router);
};
