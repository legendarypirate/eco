const db = require("../models");
const GiftSetting = db.gift_settings;

// Get gift settings (only one active setting should exist)
exports.get = async (req, res) => {
  try {
    // Get the active gift setting, or the most recent one
    const setting = await GiftSetting.findOne({
      order: [['created_at', 'DESC']]
    });

    if (!setting) {
      // Return default values if no setting exists
      return res.json({
        success: true,
        data: {
          threshold_type: 'amount',
          threshold_value: 100000,
          is_active: false
        }
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    // Handle case where table doesn't exist yet
    if (error.name === 'SequelizeDatabaseError' && 
        (error.parent?.code === '42P01' || error.message?.includes('does not exist'))) {
      console.warn('Gift settings table does not exist yet, returning defaults');
      return res.json({
        success: true,
        data: {
          threshold_type: 'amount',
          threshold_value: 100000,
          is_active: false
        }
      });
    }
    
    console.error('Get gift setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get gift setting',
      message: error.message
    });
  }
};

// Create or update gift settings
exports.createOrUpdate = async (req, res) => {
  try {
    const { threshold_type, threshold_value, is_active } = req.body;

    // Validate required fields
    if (!threshold_type || !['amount', 'count'].includes(threshold_type)) {
      return res.status(400).json({
        success: false,
        error: 'Threshold type must be either "amount" or "count"'
      });
    }

    if (threshold_value === undefined || threshold_value === null || threshold_value < 0) {
      return res.status(400).json({
        success: false,
        error: 'Threshold value must be a positive number'
      });
    }

    // Check if a setting already exists
    const existingSetting = await GiftSetting.findOne({
      order: [['created_at', 'DESC']]
    });

    let setting;
    if (existingSetting) {
      // Update existing setting
      existingSetting.threshold_type = threshold_type;
      existingSetting.threshold_value = parseFloat(threshold_value);
      existingSetting.is_active = is_active !== undefined ? is_active : true;
      await existingSetting.save();
      setting = existingSetting;
    } else {
      // Create new setting
      setting = await GiftSetting.create({
        threshold_type: threshold_type,
        threshold_value: parseFloat(threshold_value),
        is_active: is_active !== undefined ? is_active : true
      });
    }

    res.json({
      success: true,
      data: setting,
      message: 'Gift setting saved successfully'
    });
  } catch (error) {
    // Handle case where table doesn't exist yet
    if (error.name === 'SequelizeDatabaseError' && 
        (error.parent?.code === '42P01' || error.message?.includes('does not exist'))) {
      console.error('Gift settings table does not exist. Please run database migrations.');
      return res.status(503).json({
        success: false,
        error: 'Gift settings table does not exist',
        message: 'Please ensure the database table has been created'
      });
    }
    
    console.error('Create/update gift setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save gift setting',
      message: error.message
    });
  }
};

// Check if cart qualifies for gift and return gift products based on per-product floor limits
exports.checkGiftEligibility = async (req, res) => {
  try {
    const { cart_total } = req.body;

    if (cart_total === undefined || cart_total === null) {
      return res.status(400).json({
        success: false,
        error: 'cart_total must be provided'
      });
    }

    const cartTotal = parseFloat(cart_total);

    if (isNaN(cartTotal) || cartTotal < 0) {
      return res.status(400).json({
        success: false,
        error: 'cart_total must be a valid positive number'
      });
    }

    // Find all gift products where cart_total >= gift_floor_limit
    let giftProducts = [];
    try {
      const Op = db.Sequelize.Op;
      
      giftProducts = await db.products.findAll({
        where: {
          is_gift: true,
          in_stock: true,
          [Op.or]: [
            { gift_floor_limit: null }, // Products with no floor limit (always eligible)
            { gift_floor_limit: { [Op.lte]: cartTotal } } // Products where cart meets floor limit
          ]
        },
        include: [
          { 
            model: db.product_variations, 
            as: 'variations',
            where: { in_stock: true },
            required: false
          }
        ],
        order: [
          // Sort by floor limit ascending (lower limits first)
          ['gift_floor_limit', 'ASC NULLS LAST']
        ],
        limit: 50 // Increased limit to show more gift options
      });
    } catch (productError) {
      console.warn('Error fetching gift products:', productError.message);
      // If products query fails, return empty list
      return res.json({
        success: true,
        eligible: false,
        gift_products: [],
        message: 'Error fetching gift products'
      });
    }

    // Eligible if we have any gift products
    const eligible = giftProducts.length > 0;

    res.json({
      success: true,
      eligible: eligible,
      gift_products: giftProducts,
      cart_total: cartTotal,
      message: eligible 
        ? `Found ${giftProducts.length} eligible gift product(s)` 
        : 'No eligible gift products found'
    });
  } catch (error) {
    console.error('Check gift eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check gift eligibility',
      message: error.message
    });
  }
};

