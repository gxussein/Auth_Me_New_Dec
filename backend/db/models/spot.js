'use strict';
const bcrypt = require('bcryptjs');
const { Model} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {


    static associate(models) {
      Spot.hasMany(
        models.SpotImage,
        {
          foreignKey: 'spotId',
          onDelete: 'CASCADE',
          hooks: true
        }
      );
        Spot.belongsTo(
          models.User,
          { foreignKey:'ownerId',
        as:'Owner' }
        );
      Spot.hasMany(
        models.Review,
        {
          foreignKey: 'spotId',
          onDelete: 'CASCADE',
          hooks: true
        }
      );
      Spot.hasMany(
        models.Booking,
        {
          foreignKey: 'spotId',
          onDelete: 'CASCADE',
          hooks: true
        }
      );

      // define association here
    }
  }
  Spot.init({
    ownerId: DataTypes.INTEGER,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    lat: DataTypes.DECIMAL,
    lng: DataTypes.DECIMAL,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    price: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};