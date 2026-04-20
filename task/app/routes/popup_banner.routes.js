module.exports = app => {
    const popupBanner = require("../controllers/popup_banner.controller.js");
  
    var router = require("express").Router();
  
    router.post("/", popupBanner.create);
  
    router.get("/", popupBanner.findAll);
  
    router.get("/published", popupBanner.findAllPublished);
  
    router.get("/:id", popupBanner.findOne);
  
    router.put("/:id", popupBanner.update);
  
    router.delete("/:id", popupBanner.delete);
  
    router.delete("/", popupBanner.deleteAll);
  
    app.use('/api/popup-banner', router);
  };
  