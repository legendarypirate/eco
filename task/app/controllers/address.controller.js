const db = require("../models");
const Address = db.addresses;
const Op = db.Sequelize.Op;

// Save address for authenticated user (prevent duplicates)
exports.saveAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    const userId = req.user.id;
    const { city, district, khoroo, address, is_default } = req.body;

    // Validate required fields
    if (!city || !address) {
      return res.status(400).json({
        success: false,
        message: "Хот болон дэлгэрэнгүй хаяг шаардлагатай!"
      });
    }

    // Normalize address data for comparison (trim whitespace, lowercase for comparison)
    const normalizedAddress = {
      city: city.trim(),
      district: district ? district.trim() : null,
      khoroo: khoroo ? khoroo.trim() : null,
      address: address.trim()
    };

    // Check if address already exists for this user
    // Build where clause - normalize empty strings to null for comparison
    const whereClause = {
      user_id: userId,
      city: normalizedAddress.city,
      address: normalizedAddress.address,
      district: normalizedAddress.district || null,
      khoroo: normalizedAddress.khoroo || null
    };

    const existingAddress = await Address.findOne({
      where: whereClause
    });

    if (existingAddress) {
      // Address already exists, return it without creating duplicate
      return res.json({
        success: true,
        message: "Энэ хаяг аль хэдийн бүртгэгдсэн байна",
        address: existingAddress,
        isDuplicate: true
      });
    }

    // If this is set as default, unset other default addresses
    if (is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: userId, is_default: true } }
      );
    }

    // Create new address
    const newAddress = await Address.create({
      user_id: userId,
      city: normalizedAddress.city,
      district: normalizedAddress.district,
      khoroo: normalizedAddress.khoroo,
      address: normalizedAddress.address,
      is_default: is_default || false
    });

    res.json({
      success: true,
      message: "Хаяг амжилттай хадгалагдлаа",
      address: newAddress,
      isDuplicate: false
    });
  } catch (error) {
    console.error('Save address error:', error);
    res.status(500).json({
      success: false,
      message: 'Хаяг хадгалахад алдаа гарлаа',
      error: error.message
    });
  }
};

// Get all addresses for authenticated user
exports.getUserAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    const userId = req.user.id;

    const addresses = await Address.findAll({
      where: { user_id: userId },
      order: [
        ['is_default', 'DESC'], // Default addresses first
        ['created_at', 'DESC'] // Then by creation date
      ]
    });

    res.json({
      success: true,
      addresses: addresses
    });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Хаягуудыг авахад алдаа гарлаа',
      error: error.message
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify address belongs to user
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Хаяг олдсонгүй эсвэл танд энэ хаягийг устгах эрх байхгүй"
      });
    }

    await Address.destroy({
      where: { id: addressId, user_id: userId }
    });

    res.json({
      success: true,
      message: "Хаяг амжилттай устгагдлаа"
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Хаяг устгахад алдаа гарлаа',
      error: error.message
    });
  }
};

// Set default address
exports.setDefaultAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Хэрэглэгчийн ID шаардлагатай!"
      });
    }

    const userId = req.user.id;
    const addressId = req.params.id;

    // Verify address belongs to user
    const address = await Address.findOne({
      where: { id: addressId, user_id: userId }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Хаяг олдсонгүй эсвэл танд энэ хаягийг засах эрх байхгүй"
      });
    }

    // Unset other default addresses
    await Address.update(
      { is_default: false },
      { where: { user_id: userId, is_default: true } }
    );

    // Set this address as default
    await Address.update(
      { is_default: true },
      { where: { id: addressId, user_id: userId } }
    );

    res.json({
      success: true,
      message: "Үндсэн хаяг амжилттай тохируулагдлаа"
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Үндсэн хаяг тохируулахад алдаа гарлаа',
      error: error.message
    });
  }
};

