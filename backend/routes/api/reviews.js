const express = require("express");
const bcrypt = require("bcryptjs");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { setTokenCookie, requireAuth } = require("../../utils/auth");
const {
  User,
  Spot,
  Booking,
  Review,
  ReviewImage,
  SpotImage,
} = require("../../db/models");
const { sequelize } = require("../../db/models");
const { Op } = require("sequelize");
const router = express.Router();

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Stars must be an integer from 1 & 5"),
  handleValidationErrors,
];

//-----> GET/ all reviews by current user<-----//

router.get("/current", requireAuth, async (req, res, next) => {
 const reviews = await Review.findAll({
   where: {
     userId: req.user.id,
   },
   include: [
     {
       model: User,
       attributes: ["id", "firstName", "lastName"],
     },
     {
       model: Spot,
       attributes: [
         "id",
         "ownerId",
         "address",
         "city",
         "state",
         "country",
         "lat",
         "lng",
         "name",
         "price",
       ],
       include: [
         {
           model: SpotImage,
           attributes: ["url", "preview"],
         },
       ],
     },
     {
       model: ReviewImage,
       attributes: ["id", "url"],
     },
   ],
 });


  if (!reviews) {
    let err = new Error();
    err.message = `Review not found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  let reviewArr = [];
  reviews.forEach((review) => {
    const reviewObj = review.toJSON();
    const spotImgs = reviewObj.Spot.SpotImages;
    if (spotImgs.length > 0) {
      let previewImage;
      spotImgs.forEach((spotImage) => {
        if (spotImage.preview === true) {
          previewImage = spotImage.url;
        }
      });
      if (previewImage) {
        reviewObj.Spot.previewImage = previewImage;
      } else {
        reviewObj.Spot.previewImage =
          "There are no preview images for this spot";
      }
    } 

    const reviewImages = reviewObj.ReviewImages;
    if (reviewImages.length > 0) {
      reviewObj.ReviewImages.forEach((reviewImage) => {
        return {
          id: reviewImage.id,
          url: reviewImage.url,
        };
      });
    } else {
      reviewObj.ReviewImages = "There are no review images for this review";
    }

    {
      delete reviewObj.Spot.SpotImages;
      reviewArr.push(reviewObj);
    }
  });


  res.json({ Reviews: reviewArr });
});


//----->POST/ an image to a review based on reviewId<-----//

router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    let err = new Error();
    err.message = `Review couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }
   if (review.userId !== req.user.id) {
     let err = new Error();
     err.message = `Review must belong to current user`;
     err.statusCode = 404;
     return res.status(err.statusCode).json(err);
   }

  const reviewImage = await ReviewImage.create({
    reviewId: req.params.reviewId,
    url: req.body.url
    
  });

  const image = {
    id: reviewImage.id,
    url: reviewImage.url
  };

  res.status(200).json(image);
});

//----->PUT/ update review based on reviewId<-----//

router.put("/:reviewId", validateReview, requireAuth, async (req, res) => {

  const review = await Review.findOne({
    where: {
      id: req.params.reviewId,
    },
  });
  if (!review.id) {
    let err = new Error();
    err.message = `Review couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }
  if (review.userId !== req.user.id) {
    let err = new Error();
    err.message = `Review must belong to current user`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  if(review.stars > 5 || review.stars < 0) {
     let err = new Error();
    err.message = `Stars must be an integer from 1 & 5`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }
  


  review.update({
    review: req.body.review,
    stars: req.body.stars
  });
  res.status(200).json(review);
});

//----->DELETE/ an existing review<-----//

router.delete("/:reviewId", requireAuth, async (req, res) => {
  const review = await Review.findOne({
    where: {
      id: req.params.reviewId,
    },
  });

  if (!review.id) {
    let err = new Error();
    err.message = `Review couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }
  if (review.userId !== req.user.id) {
    let err = new Error();
    err.message = `Review must belong to current user`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  const deletedReview = await review.destroy();
  res.status(200).json({
    message: "Successfully deleted",
    status: 200,
  });

  res.status(200).json(deletedReview);
});

module.exports = router;