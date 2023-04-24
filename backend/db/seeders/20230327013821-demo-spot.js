'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    options.tableName = 'Spots';
    return queryInterface.bulkInsert(options, [
      {
        ownerId: 1,
        address: '123 Apple St',
        city: 'Houston',
        state: 'Texas',
        country: 'United States',
        lat: 33.645,
        lng: 33.853,
        name: 'Houston house',
        description:
          'Never seen a space, come check this Houston AirBnB because it is out of this World. Houston WE HAVE A AIRBNB',
        price: 300,
      },
      {
        ownerId: 2,
        address: '123 Main Ave',
        city: 'New York City',
        state: 'New York',
        country: 'United States',
        lat: 88.765,
        lng: 88.644,
        name: 'New York house',
        description:
          'Get sturdy by staying in this Sturdy Apt',
        price: 200,
      },
      {
        ownerId: 3,
        address: '123 Forrest Ln',
        city: 'Miami',
        state: 'Florida',
        country: 'United States',
        lat: 66.755,
        lng: 66.578,
        name: 'Florida house',
        description:
         'Why only have spring break for a week when you can have it whenever youd like',
        price: 500,
      },
    ], {});

  },
  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Spots'
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      country: { [Op.in]: ['United States'] }
    }, {});
  }
};
