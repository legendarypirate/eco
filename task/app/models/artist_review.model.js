// models/artist_review.model.js
module.exports = (sequelize, Sequelize) => {
  const ArtistReview = sequelize.define("artist_review", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    artistId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'artist_id',
      references: {
        model: 'artists',
        key: 'id'
      }
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    userName: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'user_name'
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    comment: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    helpfulCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      field: 'helpful_count'
    },
    images: {
      type: Sequelize.JSON,
      defaultValue: []
    },
    isApproved: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      field: 'is_approved'
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
    tableName: 'artist_reviews',
    underscored: false,
    indexes: [
      {
        fields: ['artist_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return ArtistReview;
};

