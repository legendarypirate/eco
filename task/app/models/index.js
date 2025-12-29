// models/index.js - FIXED VERSION
const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config.js");

// Create a new Sequelize instance
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  logging: false, // Disable logging for cleaner output
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

// Assign Sequelize
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ====== REGISTER MODELS ======
// ✅ Register CORE models first (without relationships)
db.users = require("./user.model.js")(sequelize, Sequelize);
db.products = require("./product.model.js")(sequelize, Sequelize);
db.categories = require("./category.model.js")(sequelize, Sequelize);

// Then register other models
db.product_variations = require("./product_variation.model.js")(sequelize, Sequelize);
db.tasks = require("./task.model.js")(sequelize, Sequelize);
db.orders = require("./order.model.js")(sequelize, Sequelize);
db.order_items = require("./order_item.model.js")(sequelize, Sequelize);
db.color_options = require("./color_option.model.js")(sequelize, Sequelize);
db.reviews = require("./review.model.js")(sequelize, Sequelize);
db.cart_items = require("./cart_item.model.js")(sequelize, Sequelize);

// ====== FIXED: Register junction tables WITHOUT foreign keys first ======

// 1. Product Favorites table (without foreign keys initially)
db.productFavorites = sequelize.define('product_favorites', {
  userId: {
    type: Sequelize.UUID,
    primaryKey: true
    // ✅ REMOVED references initially
  },
  productId: {
    type: Sequelize.UUID,
    primaryKey: true
    // ✅ REMOVED references initially
  }
}, {
  timestamps: true,
  tableName: 'product_favorites',
  underscored: true
});

// 2. Product Categories table (without foreign keys initially)
db.productCategories = sequelize.define('product_categories', {
  productId: {
    type: Sequelize.UUID,
    primaryKey: true
    // ✅ REMOVED references initially
  },
  categoryId: {
    type: Sequelize.UUID,
    primaryKey: true
    // ✅ REMOVED references initially
  }
}, {
  timestamps: false,
  tableName: 'product_categories',
  underscored: true
});

// ====== BASIC RELATIONSHIPS ======

// User self-reference
db.users.belongsTo(db.users, {
  foreignKey: "supervisor_id",
  as: "supervisor",
  constraints: false
});
db.users.hasMany(db.users, {
  foreignKey: "supervisor_id",
  as: "subordinates",
  constraints: false
});

// Simple product relationships (no foreign keys initially)
db.products.hasMany(db.product_variations, { 
  foreignKey: "productId", 
  as: "variations",
  constraints: false
});
db.product_variations.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product",
  constraints: false
});

// Color options relationship
db.products.hasMany(db.color_options, { 
  foreignKey: "productId", 
  as: "colorOptions",
  constraints: false
});
db.color_options.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product",
  constraints: false
});

// Order-OrderItem relationships
db.orders.hasMany(db.order_items, {
  foreignKey: "order_id",
  as: "items",
  constraints: false
});
db.order_items.belongsTo(db.orders, {
  foreignKey: "order_id",
  as: "order",
  constraints: false
});

// Review relationships
db.reviews.belongsTo(db.products, {
  foreignKey: "productId",
  as: "product",
  constraints: false
});
db.reviews.belongsTo(db.users, {
  foreignKey: "userId",
  as: "user",
  constraints: false
});
db.products.hasMany(db.reviews, {
  foreignKey: "productId",
  as: "reviews",
  constraints: false
});
db.users.hasMany(db.reviews, {
  foreignKey: "userId",
  as: "reviews",
  constraints: false
});

// Call associate functions if they exist (for models that define their own associations)
Object.keys(db).forEach(modelName => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
    } catch (err) {
      console.log(`Warning: Error calling associate for ${modelName}:`, err.message);
    }
  }
});

// ====== SYNC FUNCTION WITH STEP-BY-STEP APPROACH ======
db.syncDatabase = async function(options = {}) {
  try {
    console.log('🔄 Starting database sync...');
    
    // Test connection
    await this.sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Enable UUID extension for PostgreSQL if needed
    if (dbConfig.dialect === 'postgres') {
      try {
        await this.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ UUID extension enabled');
      } catch (e) {
        console.log('ℹ️ UUID extension already exists or not needed');
      }
    }
    
    // Step 1: Create core tables WITHOUT foreign keys
    console.log('📦 Step 1: Creating core tables...');
    const coreModels = ['users', 'products', 'categories'];
    
    for (const modelName of coreModels) {
      try {
        await db[modelName].sync({ force: false });
        console.log(`✅ ${modelName} table created`);
      } catch (error) {
        console.log(`ℹ️ ${modelName} table may already exist: ${error.message}`);
      }
    }
    
    // Step 2: Create other tables WITHOUT foreign keys
    console.log('📦 Step 2: Creating other tables...');
    const otherModels = [
      'product_variations', 'tasks', 'orders', 'order_items',
      'color_options', 'reviews', 'cart_items',
      'productFavorites', 'productCategories'
    ];
    
    for (const modelName of otherModels) {
      try {
        const model = db[modelName];
        // Get table name
        const tableName = model.tableName || model.name.toLowerCase() + 's';
        
        // Check if table exists
        const [results] = await this.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${tableName}'
          )
        `);
        
        if (!results[0].exists) {
          await model.sync({ force: false });
          console.log(`✅ ${tableName} table created`);
        } else {
          console.log(`ℹ️ ${tableName} table already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating ${modelName}: ${error.message}`);
      }
    }
    
    // Step 3: Add foreign key constraints AFTER all tables exist
    console.log('🔗 Step 3: Adding foreign key constraints...');
    
    try {
      // Add constraints to product_favorites
      await this.sequelize.query(`
        ALTER TABLE product_favorites
        ADD CONSTRAINT product_favorites_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
        ADD CONSTRAINT product_favorites_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ Added product_favorites foreign keys');
    } catch (error) {
      console.log(`ℹ️ product_favorites constraints may already exist: ${error.message}`);
    }
    
    try {
      // Add constraints to product_categories
      await this.sequelize.query(`
        ALTER TABLE product_categories
        ADD CONSTRAINT product_categories_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) 
        ON DELETE CASCADE,
        ADD CONSTRAINT product_categories_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES categories(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ Added product_categories foreign keys');
    } catch (error) {
      console.log(`ℹ️ product_categories constraints may already exist: ${error.message}`);
    }
    
    try {
      // Add constraints to reviews
      await this.sequelize.query(`
        ALTER TABLE reviews
        ADD CONSTRAINT reviews_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
        ADD CONSTRAINT reviews_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ Added reviews foreign keys');
    } catch (error) {
      console.log(`ℹ️ reviews constraints may already exist: ${error.message}`);
    }
    
    // Step 4: Update column names if needed (underscore vs camelCase)
    console.log('🔄 Step 4: Ensuring column naming consistency...');
    
    try {
      // Check if product_favorites has userId/user_id columns
      const [favoriteCols] = await this.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'product_favorites'
      `);
      
      const hasUserId = favoriteCols.some(col => col.column_name === 'user_id');
      const hasUser_Id = favoriteCols.some(col => col.column_name === 'user_id');
      
      if (!hasUserId && hasUser_Id) {
        await this.sequelize.query(`
          ALTER TABLE product_favorites
          RENAME COLUMN "userId" TO user_id,
          RENAME COLUMN "productId" TO product_id
        `);
        console.log('✅ Renamed product_favorites columns to snake_case');
      }
    } catch (error) {
      console.log(`ℹ️ Column renaming not needed: ${error.message}`);
    }
    
    console.log('🎉 Database sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
    console.error('Full error:', error);
    
    // Try a simpler approach
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Trying simple sync...');
      try {
        await this.sequelize.sync({ alter: true });
        console.log('✅ Simple sync completed');
      } catch (simpleError) {
        console.error('❌ Simple sync failed:', simpleError.message);
        
        // Last resort: Drop and recreate
        console.log('🔥 Last resort: Dropping all tables...');
        try {
          await this.sequelize.drop();
          console.log('✅ Tables dropped');
          await this.sequelize.sync();
          console.log('✅ Database recreated');
        } catch (dropError) {
          console.error('💥 Critical error:', dropError.message);
        }
      }
    }
  }
};

// ====== ALTERNATIVE: SIMPLE SYNC FOR DEVELOPMENT ======
db.simpleSync = async function() {
  try {
    console.log('🔄 Simple sync (development only)...');
    
    // Disable foreign key checks if supported
    if (dbConfig.dialect === 'mysql') {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    }
    
    // Sync all models with constraints disabled
    await this.sequelize.sync({ 
      force: false,
      alter: true,
      logging: false
    });
    
    if (dbConfig.dialect === 'mysql') {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    console.log('✅ Simple sync completed');
  } catch (error) {
    console.error('❌ Simple sync failed:', error.message);
  }
};

// ====== CHECK AND FIX USER TABLE ======
db.fixUserTable = async function() {
  try {
    console.log('🔧 Checking users table structure...');
    
    // Check if users table has UUID id
    const [columns] = await this.sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'id'
    `);
    
    if (columns.length === 0) {
      console.log('❌ users table missing id column');
      
      // Add UUID id column
      await this.sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
      `);
      console.log('✅ Added UUID id to users table');
    } else if (columns[0].data_type !== 'uuid') {
      console.log(`⚠️ users.id is ${columns[0].data_type}, converting to UUID...`);
      
      // Create temp column, copy data, drop old, rename
      await this.sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN new_id UUID DEFAULT uuid_generate_v4(),
        ADD COLUMN temp_id SERIAL;
        
        UPDATE users SET temp_id = id::integer WHERE id ~ '^[0-9]+$';
        
        ALTER TABLE users 
        DROP CONSTRAINT users_pkey,
        DROP COLUMN id;
        
        ALTER TABLE users 
        RENAME COLUMN new_id TO id;
        
        ALTER TABLE users 
        ADD PRIMARY KEY (id);
        
        ALTER TABLE users 
        DROP COLUMN temp_id;
      `);
      console.log('✅ Converted users.id to UUID');
    } else {
      console.log('✅ users table has UUID id');
    }
    
  } catch (error) {
    console.error('❌ Error fixing users table:', error.message);
  }
};

module.exports = db;