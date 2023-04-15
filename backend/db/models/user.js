'use strict';
const bcrypt = require('bcryptjs');
const { Model, Validator } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
       toSafeObject() {
            const { id, firstName, lastName, email, username} = this; // context will be the User instance
            return { id, firstName, lastName, email, username};
        }

        validatePassword(password) {
            return bcrypt.compareSync(password, this.hashedPassword.toString());
        }

        static getCurrentUserById(id) {
            return User.scope('currentUser').findByPk(id);
        }

        static async login({ credential, password }) {
            const { Op } = require('sequelize');
            const user = await User.scope('loginUser').findOne({
                where: {
                    [Op.or]: {
                        username: credential,
                        email: credential
                    }
                }
            });
            if (user && user.validatePassword(password)) {
                return await User.scope('currentUser').findByPk(user.id);
            }
        }

        static async signup({ firstName, lastName, username, email, token, password }) {
            const hashedPassword = bcrypt.hashSync(password);
            const user = await User.create({
                firstName,
                lastName,
                email,
                username,
                token,
                hashedPassword
            });
            return await User.scope('currentUser').findByPk(user.id);
        }

        static associate(models) {
        User.hasMany(
            models.Spot,
            { foreignKey: 'ownerId', onDelete:'CASCADE', hooks: true}
        );
        User.hasMany(
            models.Booking,
            { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true }
        );
        User.hasMany(
            models.Review,
            { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true }
        );
            // define association here
        }
    };
    User.init(
        {
            firstName: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    len: [1, 30]
                }
            },
            lastName: {
                allowNull: false,
                type: DataTypes.STRING,
                validate: {
                    len: [1, 30]
                }
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                isUnique: true,
                validate: {
                    len: [4, 30],
                    isNotEmail(value) {
                        if (Validator.isEmail(value)) {
                            throw new Error("Cannot be an email.");
                        }
                    },

                }
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                isUnique: true,
                validate: {
                    len: [3, 256],
                    isEmail: true
                }
            },
            token: {
                type: DataTypes.STRING,
                validate: {
                    len: [0,30]
                }
            },

            isUser: {
                type: DataTypes.BOOLEAN
            },

            hashedPassword: {
                type: DataTypes.STRING.BINARY,
                allowNull: false,
                validate: {
                    len: [60, 60]
                }
            }
        },
        {
            sequelize,
            modelName: "User",
            defaultScope: {
                attributes: {
                    exclude: ["firstName", "lastName", "hashedPassword", "email", "createdAt", "updatedAt", "token", "isUser"]
                }
            },
            scopes: {
                currentUser: {
                    attributes: {
                    exclude: ["token","isUser", "hashedPassword","createdAt","updatedAt"]
                    }
                },
                loginUser: {
                    attributes: {}
                }
            }
        }
    );
    return User;
};