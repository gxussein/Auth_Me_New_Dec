"use strict";

/** @type {import('sequelize-cli').Migration} */

let options = {};

if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = "Bookings";
    await queryInterface.bulkInsert(
      options,
      [
        {
          spotId: 1,
          userId: 1,
          startDate: new Date("2016-01-01"),
          endDate: new Date("2016-02-02”),
        },
        {
          spotId: 2,
          userId: 2,
          startDate: new Date("2017-03-03”),
          endDate: new Date("2017-04-04”),
        },
        {
          spotId: 3,
          userId: 3,
          startDate: new Date("2018-05-05”),
          endDate: new Date("2018-06-06”),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Bookings";
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2, 3] },
      },
      {}
    );
  },
};