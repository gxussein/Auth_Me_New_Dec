
const express = require('express');
const router = express.Router();
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User, Spot, Review, SpotImage, ReviewImage, Booking } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

router.delete("/:imageId", requireAuth, async (req, res, next) => {
  const { imageId } = req.params;
  const { id: userId } = req.user;

  const image = await ReviewImage.findByPk(imageId);

  if (!image) {
      return next({
          title: "Couldn't find a Review Image with the specified id",
          status: 404,
          message: "Review Image couldn't be found"
      });
  }

  const review = await image.getReview();
  if (userId !== review.userId) {
      return next({
          title: "Authorization error",
          status: 403,
          message: "Cannot delete image from review not left by user"
      });
  }

  await image.destroy();

  res.json({
      message: "Successfully deleted",
      statusCode: 200
  });
});

module.exports = router;
