
const express = require('express');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors,
];

router.post('/', validateSignup, async (req, res, next) => {
  const { firstName, lastName, email, password, username } = req.body;
  try {
    const user = await User.signup({
      firstName,
      lastName,
      email,
      username,
      password,
    });
    await setTokenCookie(res, user);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
