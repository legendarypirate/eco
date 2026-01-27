const db = require("../models");
const Coupon = db.coupons;
const CouponUsage = db.coupon_usage;
const { Op } = require("sequelize");

// Generate a unique 6-character uppercase coupon code
const generateCouponCode = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 6-character code
    code = '';
    for (let i = 0; i < 6; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ where: { code } });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique coupon code after multiple attempts');
  }

  return code;
};

// Get all coupons (admin)
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100); // Cap at 100 to prevent memory issues

    // Build where clause
    const whereClause = {};

    // Search by code
    if (search && search.trim()) {
      whereClause.code = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Filter by status
    const now = new Date();
    if (status === 'active') {
      whereClause.is_active = true;
      whereClause.expires_at = {
        [Op.gt]: now
      };
    } else if (status === 'inactive') {
      whereClause.is_active = false;
    } else if (status === 'expired') {
      whereClause.expires_at = {
        [Op.lt]: now
      };
    }

    // Get total count
    const totalCount = await Coupon.count({ where: whereClause });

    // Get coupons with pagination
    const coupons = await Coupon.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: maxLimit,
      offset: offset
    });

    // Get usage counts for all coupons
    const couponIds = coupons.map(c => c.id);
    let usageMap = {};
    
    if (couponIds.length > 0) {
      const usageCounts = await CouponUsage.findAll({
        where: { coupon_id: { [Op.in]: couponIds } },
        attributes: ['coupon_id', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        group: ['coupon_id'],
        raw: true
      });

      usageCounts.forEach(item => {
        usageMap[item.coupon_id] = parseInt(item.count) || 0;
      });
    }

    // Add usage count to each coupon
    const couponsWithStats = coupons.map(coupon => {
      const couponData = coupon.toJSON();
      return {
        ...couponData,
        usage_count: usageMap[coupon.id] || 0
      };
    });

    res.json({
      success: true,
      data: couponsWithStats,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: maxLimit,
        totalPages: Math.ceil(totalCount / maxLimit)
      }
    });
  } catch (error) {
    console.error('Get all coupons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coupons',
      message: error.message
    });
  }
};

// Get coupon by ID (admin)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Get usage count
    const usageCount = await CouponUsage.count({
      where: { coupon_id: id }
    });

    const couponData = coupon.toJSON();
    couponData.usage_count = usageCount;

    res.json({
      success: true,
      data: couponData
    });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coupon',
      message: error.message
    });
  }
};

// Create new coupon(s) (admin)
exports.create = async (req, res) => {
  try {
    const { discount_percentage, expires_at, is_active, code, count } = req.body;

    // Validate required fields
    if (!discount_percentage || discount_percentage <= 0 || discount_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Discount percentage must be between 1 and 100'
      });
    }

    if (!expires_at) {
      return res.status(400).json({
        success: false,
        error: 'Expiration date is required'
      });
    }

    // Validate expiration date is in the future
    const expirationDate = new Date(expires_at);
    if (expirationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Expiration date must be in the future'
      });
    }

    const isManual = !!code; // If code is provided, it's manual
    const couponCount = count && count > 1 ? parseInt(count) : 1;

    // If manual code provided, validate it
    if (isManual) {
      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode.length < 1 || normalizedCode.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code must be between 1 and 50 characters'
        });
      }

      // Check if code already exists
      const existing = await Coupon.findOne({ where: { code: normalizedCode } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code already exists'
        });
      }

      // Create single manual coupon
      const coupon = await Coupon.create({
        code: normalizedCode,
        discount_percentage: parseFloat(discount_percentage),
        expires_at: expirationDate,
        is_active: is_active !== undefined ? is_active : true,
        is_manual: true
      });

      return res.status(201).json({
        success: true,
        data: coupon,
        message: 'Coupon created successfully'
      });
    } else {
      // Generate multiple random coupons
      if (couponCount > 100) {
        return res.status(400).json({
          success: false,
          error: 'Cannot generate more than 100 coupons at once'
        });
      }

      const coupons = [];
      const errors = [];

      for (let i = 0; i < couponCount; i++) {
        try {
          const generatedCode = await generateCouponCode();
          const coupon = await Coupon.create({
            code: generatedCode,
            discount_percentage: parseFloat(discount_percentage),
            expires_at: expirationDate,
            is_active: is_active !== undefined ? is_active : true,
            is_manual: false
          });
          coupons.push(coupon);
        } catch (err) {
          errors.push(`Failed to generate coupon ${i + 1}: ${err.message}`);
        }
      }

      if (coupons.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate any coupons',
          errors: errors
        });
      }

      return res.status(201).json({
        success: true,
        data: coupons,
        message: `Successfully created ${coupons.length} coupon(s)`,
        errors: errors.length > 0 ? errors : undefined
      });
    }
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coupon',
      message: error.message
    });
  }
};

// Update coupon (admin)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_percentage, expires_at, is_active } = req.body;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Validate discount percentage if provided
    if (discount_percentage !== undefined) {
      if (discount_percentage <= 0 || discount_percentage > 100) {
        return res.status(400).json({
          success: false,
          error: 'Discount percentage must be between 1 and 100'
        });
      }
      coupon.discount_percentage = parseFloat(discount_percentage);
    }

    // Validate expiration date if provided
    if (expires_at !== undefined) {
      const expirationDate = new Date(expires_at);
      if (expirationDate <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Expiration date must be in the future'
        });
      }
      coupon.expires_at = expirationDate;
    }

    if (is_active !== undefined) {
      coupon.is_active = is_active;
    }

    await coupon.save();

    res.json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coupon',
      message: error.message
    });
  }
};

// Delete coupon (admin)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Delete associated usage records first
    await CouponUsage.destroy({ where: { coupon_id: id } });

    // Delete the coupon
    await coupon.destroy();

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coupon',
      message: error.message
    });
  }
};

// Validate and apply coupon (user endpoint)
exports.validate = async (req, res) => {
  try {
    const { code, subtotal, user_id } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }

    if (!subtotal || subtotal <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Subtotal must be greater than 0'
      });
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase().trim();

    // Find coupon
    const coupon = await Coupon.findOne({
      where: { code: normalizedCode }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Урамшууллын код олдсонгүй',
        message: 'Урамшууллын код олдсонгүй'
      });
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Урамшууллын код идэвхгүй байна',
        message: 'Урамшууллын код идэвхгүй байна'
      });
    }

    // Check if coupon is expired
    const now = new Date();
    if (new Date(coupon.expires_at) < now) {
      return res.status(400).json({
        success: false,
        error: 'Урамшууллын код хугацаа дууссан',
        message: 'Урамшууллын код хугацаа дууссан'
      });
    }

    // Check coupon usage based on type
    if (coupon.is_manual) {
      // Manual coupons: can be used by many users, but one per user
      if (user_id) {
        const existingUsage = await CouponUsage.findOne({
          where: {
            coupon_id: coupon.id,
            user_id: user_id
          }
        });

        if (existingUsage) {
          return res.status(400).json({
            success: false,
            error: 'Та энэ урамшууллын кодыг аль хэдийн ашигласан байна',
            message: 'Та энэ урамшууллын кодыг аль хэдийн ашигласан байна'
          });
        }
      }
    } else {
      // Random coupons: can only be used once total
      const existingUsage = await CouponUsage.findOne({
        where: {
          coupon_id: coupon.id
        }
      });

      if (existingUsage) {
        return res.status(400).json({
          success: false,
          error: 'Энэ урамшууллын кодыг аль хэдийн ашигласан байна',
          message: 'Энэ урамшууллын кодыг аль хэдийн ашигласан байна'
        });
      }
    }

    // Calculate discount amount
    const discountAmount = (subtotal * parseFloat(coupon.discount_percentage)) / 100;

    res.json({
      success: true,
      data: {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_percentage: parseFloat(coupon.discount_percentage),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        expires_at: coupon.expires_at
      },
      message: 'Урамшууллын код хүчинтэй'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Урамшууллын код шалгахад алдаа гарлаа',
      message: error.message
    });
  }
};

// Record coupon usage (called when order is created)
exports.recordUsage = async (couponId, userId, orderId, discountAmount) => {
  try {
    // Check if coupon can still be used
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      console.error(`Coupon ${couponId} not found`);
      return false;
    }

    if (!coupon.is_manual) {
      // Random coupon: check if already used
      const existingUsage = await CouponUsage.findOne({
        where: { coupon_id: couponId }
      });
      if (existingUsage) {
        console.error(`Random coupon ${couponId} already used`);
        return false;
      }
    } else {
      // Manual coupon: check if user already used it
      if (userId) {
        const existingUsage = await CouponUsage.findOne({
          where: {
            coupon_id: couponId,
            user_id: userId
          }
        });
        if (existingUsage) {
          console.error(`User ${userId} already used manual coupon ${couponId}`);
          return false;
        }
      }
    }

    await CouponUsage.create({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
      used_at: new Date()
    });
    return true;
  } catch (error) {
    console.error('Record coupon usage error:', error);
    return false;
  }
};

// Get coupon statistics for dashboard
exports.getStatistics = async (req, res) => {
  try {
    const totalCoupons = await Coupon.count();
    const usedCoupons = await CouponUsage.findAll({
      attributes: ['coupon_id'],
      group: ['coupon_id'],
      raw: true
    });
    const usedCouponCount = usedCoupons.length;
    const usageRate = totalCoupons > 0 ? (usedCouponCount / totalCoupons) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_coupons: totalCoupons,
        used_coupons: usedCouponCount,
        usage_rate: parseFloat(usageRate.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get coupon statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coupon statistics',
      message: error.message
    });
  }
};

