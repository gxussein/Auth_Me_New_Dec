"use strict";

/** @type {import('sequelize-cli').Migration} */

let options = {};

if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = "Reviews";

    await queryInterface.bulkInsert(
      options,
      [
        {
          spotId: 1,
          userId: 3,
          review: "Really Good",
          stars: 5,
        },
        {
          spotId: 2,
          userId: 1,
          review: "It was aight",
          stars: 3,
        },
        {
          spotId: 3,
          userId: 2,
          review: "Ehh but im nice",
          stars: 4,
        },
        {
          spotId: 2,
          userId: 1,
          review: "Solid like a Drake Song",
          stars: 4,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Reviews";
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