const db = require("../models");
const Vendor = db.vendors;
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

function isUuid(s) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  );
}

/** If Authorization Bearer JWT is present and valid, sets req.user (same shape as verifyToken). */
exports.optionalVerifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return next();
    try {
      const user = await db.users.findByPk(decoded.userId, {
        attributes: [
          "id",
          "email",
          "full_name",
          "role",
          "phone",
          "is_active",
        ],
      });
      if (user && user.is_active) req.user = user;
    } catch (e) {
      /* ignore */
    }
    next();
  });
};

/** After optionalVerifyToken + user: load vendor row for this user → req.vendor */
exports.attachVendor = async (req, res, next) => {
  if (!req.user) return next();
  try {
    const vendor = await Vendor.findOne({
      where: { user_id: req.user.id },
    });
    req.vendor = vendor || null;
  } catch (e) {
    req.vendor = null;
  }
  next();
};

/** Seller must have an active vendor account. */
exports.requireActiveVendor = (req, res, next) => {
  const v = req.vendor;
  if (!v) {
    return res.status(403).json({
      success: false,
      message: "Дэлгүүрийн бүртгэл олдсонгүй. Эхлээд худалдаачнаар бүртгүүлнэ үү.",
    });
  }
  if (v.status !== "active") {
    return res.status(403).json({
      success: false,
      message: `Дэлгүүрийн төлөв: ${v.status}. Идэвхжсэний дараа бараа нэмнэ үү.`,
    });
  }
  next();
};

exports.isUuid = isUuid;
