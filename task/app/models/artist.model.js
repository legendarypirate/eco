// models/artist.model.js
module.exports = (sequelize, Sequelize) => {
  const Artist = sequelize.define("artist", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    nameMn: {
      type: Sequelize.STRING,
      field: 'name_mn'
    },
    image: {
      type: Sequelize.STRING,
      allowNull: true
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    bioMn: {
      type: Sequelize.TEXT,
      field: 'bio_mn',
      allowNull: true
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    location: {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'location'
    },
    category: {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'category'
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true,
      field: 'title'
    },
    productsCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      field: 'products_count'
    },
    yearsExperience: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      field: 'years_experience'
    },
    happyCustomers: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      field: 'happy_customers'
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'updated_at'
    }
  }, {
    timestamps: true,
    tableName: 'artists',
    underscored: false
  });

  return Artist;
};

