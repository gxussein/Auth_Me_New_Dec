// 'use strict';
// const bcrypt = require('bcryptjs');

// let options = {};
// if (process.env.NODE_ENV === 'production') {
//   options.schema = process.env.SCHEMA;  // define your schema in options object
// };


// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     options.tableName = 'Users';
//     return queryInterface.bulkInsert(
//       options,
//       [
//         {
//           firstName: 'Nick',
//           lastName: 'Jonas',
//           email: 'nickjonas@gmail.com',
//           username: 'nick_bro',
//           hashedPassword: bcrypt.hashSync('password')
//         },
//         {
//           firstName: 'Joe',
//           lastName: “Jonas”,
//           email: 'joejonas@gmail.com',
//           username: 'joe_bro',
//           hashedPassword: bcrypt.hashSync('password2')
//         },
//         {
//           firstName: 'Kevin',
//           lastName: 'Jonas',
//           email: 'kevinjonas@gmail.com',
//           username: 'kevin_bro',
//           hashedPassword: bcrypt.hashSync('password3')
//         },
//       ],
//       
//     );
//   },

//   down: async (queryInterface, Sequelize) => {
//     options.tableName = 'Users';
//     const Op = Sequelize.Op;
//     return queryInterface.bulkDelete(
//       options,
//       {
//         username: { [Op.in]: ['nick_bro', 'joe_bro', 'kevin_bro'] },
//       },
//       
//     );
//   },
// };

'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    return queryInterface.bulkInsert(options, [
      {
        firstName: 'Nick',
        lastName: 'Jonas',
        email: 'demo@user.io',
        username: 'Demo-lition',
        hashedPassword: bcrypt.hashSync('password')
      },
      {
        firstName: 'Nick',
        lastName: 'Jonas',
        email: 'user1@user.io',
        username: 'FakeUser1',
        hashedPassword: bcrypt.hashSync('password2')
      },
      {
        firstName: 'Nick',
        lastName: 'Jonas',
        email: 'user2@user.io',
        username: 'FakeUser2',
        hashedPassword: bcrypt.hashSync('password3')
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['Demo-lition', 'FakeUser1', 'FakeUser2'] }
    }, {});
  }
};