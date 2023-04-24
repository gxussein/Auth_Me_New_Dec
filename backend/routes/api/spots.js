

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

// GET all spots//

const validateSpots = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .withMessage("Latitude is not valid"),
  check("lng")
    .exists({ checkFalsy: true })
    .withMessage("Longitude is not valid"),
  check("name")
    .isLength({ max: 50 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Price per day is required"),
  handleValidationErrors,
];

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Stars must be an integer from 1 & 5"),
  handleValidationErrors,
];

const validateImage = [
  check("url").exists({ checkFalsy: true }).withMessage("Url is required"),
  check("preview").exists().withMessage("Preview is required"),
  handleValidationErrors,
];

const validateBookings = [
  check("startDate")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Invalid start date"),
  check("endDate")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Invalid end date"),
  handleValidationErrors,
];

router.get("/", async (req, res) => {
  let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } =
    req.query;

  page = parseInt(page);
  size = parseInt(size);

  let pagination = {};

  let validationError = {};

  if (page > 10 || !page) page = 1;
  if (size > 20 || !size) size = 20;

  if (page >= 1 && size >= 1) {
    pagination.limit = size;
    pagination.offset = size * (page - 1);
  }

  if (page <= 0 || isNaN(page))
    validationError.page = "Page must be a number greater than or equal to 1";

  if (size <= 0 || isNaN(size))
    validationError.size = "Size must be a number greater than or equal to 1";

  if (maxLat && isNaN(maxLat))
    validationError.maxLat = "Maximum latitude is invalid";
  if (minLat && isNaN(minLat))
    validationError.minLat = "Minimum latitude is invalid";
  if (minLng && isNaN(minLng))
    validationError.minLng = "Minimum longitude is invalid";
  if (maxLng && isNaN(maxLng))
    validationError.maxLng = "Maximum longitude is invalid";
  if ((minPrice && isNaN(minPrice)) || minPrice < 0)
    validationError.minPrice =
      "Mimimum price must be a number greater than or equal to 0";
  if ((maxPrice && isNaN(maxPrice)) || maxPrice < 0)
    validationError.maxPrice =
      "Maximum price must be a number greater than or equal to 0";

  if (Object.keys(validationError).length) {
    let errResult = new Error("Validation Error");
    errResult.errors = validationError;
    return res
      .status(400)
      .json({ message: errResult.message, errors: errResult.errors });
  }

  const where = {};

  if (minLat || maxLat) {
    where.lat = {};
    if (minLat) {
      where.lat[Op.gte] = minLat;
    }
    if (maxLat) {
      where.lat[Op.lte] = maxLat;
    }
  }

  if (minLng || maxLng) {
    where.lng = {};
    if (minLng) {
      where.lng[Op.gte] = minLng;
    }
    if (maxLng) {
      where.lng[Op.lte] = maxLng;
    }
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price[Op.gte] = minPrice;
    }
    if (maxPrice) {
      where.price[Op.lte] = maxPrice;
    }
  }

  const spots = await Spot.findAll({
    ...pagination,
    where,
  });

  let spotsArr = [];
  spots.forEach((spot) => {
    spotsArr.push(spot.toJSON());
  });

  for (let spot of spotsArr) {
    const rating = await Review.findAll({
      where: {
        spotId: spot.id,
      },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("stars")), "avgStarRating"],
      ],
    });

    const avgRating = rating[0].getDataValue("avgStarRating");
    spot.avgStarRating = Number(avgRating).toFixed(2);

    const previewImg = await SpotImage.findOne({
      where: {
        spotId: spot.id,
        preview: true,
      },
      attributes: ["url"],
    });

    if (previewImg) {
      spot.previewImg = previewImg.url;
    } else {
      spot.previewImg = "No preview image found";
    }

  
  }

  res.status(200).json({ Spots: spotsArr, page, size });
});

//GET/all spots by the current user//

router.get("/current", requireAuth, async (req, res) => {
  const spots = await Spot.findAll({
    where: {
      ownerId: req.user.id,
    },
    include: [
      {
        model: Review,
      },
      {
        model: SpotImage,
      },
    ],
  });

  let spotsArr = [];
  spots.forEach((spot) => {
    spotsArr.push(spot.toJSON());
  });

  for (let spot of spotsArr) {
    const rating = await Review.findAll({
      where: {
        spotId: spot.id,
      },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("stars")), "avgStarRating"],
      ],
    });


    const avgRating = rating[0].getDataValue("avgStarRating");
    spot.avgStarRating = Number(avgRating).toFixed(2);

    const previewImg = await SpotImage.findOne({
      where: {
        spotId: spot.id,
        preview: true,
      },
      attributes: ["url"],
    });

    if (previewImg) {
      spot.previewImg = previewImg.url;
    } else {
      spot.previewImg = "No preview image found";
    }

    delete spot.Reviews;
    delete spot.SpotImages;
  }
  res.status(200).json({ Spots: spotsArr });
});

//GET/all spots by id//

router.get("/:spotId", async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId, {
    include: [
      {
        model: SpotImage,
        attributes: ["id", "url", "preview"],
      },
      {
        model: User,
        as: "Owner",
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Review,
      },
    ],
    attributes: {
      include: [
        [sequelize.fn("COUNT", sequelize.col("Reviews.id")), "numReviews"],
        [sequelize.fn("AVG", sequelize.col("Reviews.stars")), "avgStarRating"],
      ],
    },
  });

  if (!spot.id) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  const resObj = {
    ...spot.toJSON(),
    numReviews: spot.getDataValue("numReviews"),
    avgStarRating: spot.getDataValue("avgStarRating"),
  };

  spot.SpotImages.forEach((image) => {
    //const  { id, url, preview } = image.toJSON();
    resObj.SpotImages.push(image);
  });

  delete resObj.Reviews;

  res.status(200).json(resObj);
});

//----->POST/ a spot<-----//

router.post("/", validateSpots, requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const spot = await Spot.create({
    ownerId: req.user.id,
    address,
    city,
    state,
    country,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    name,
    description,
    price: parseFloat(price),
  });

  res.status(201).json(spot);
});

//----->POST/ an img for spot via spotId<-----//

router.post("/:spotId/images", validateImage, requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot.id) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  if (spot.ownerId !== req.user.id) {
    let err = new Error();
    err.message = `Spot must belong to the current user`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }
  const { url, preview } = req.body;
  const newImage = await SpotImage.create({
    spotId: req.params.spotId,
    url,
    preview,
  });

  const image = {
    id: newImage.id,
    url: newImage.url,
    preview: newImage.preview,
  };

  res.status(200).json(image);
});

//----->PUT/a spot<-----//

router.put("/:spotId", validateSpots, requireAuth, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  if (spot.ownerId !== req.user.id) {
    let err = new Error();
    err.message = `Spot must belong to the current user`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  spot.city = city;
  spot.address = address;
  spot.state = state;
  spot.country = country;
  spot.lat = lat;
  spot.lng = lng;
  spot.name = name;
  spot.description = description;
  spot.price = price;

  await spot.save();

  res.status(200).json(spot);
});

//----->DELETE/ a spot<-----//

router.delete("/:spotId", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  if (spot.ownerId !== req.user.id) {
    let err = new Error();
    err.message = `Spot must belong to the current user`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  await Spot.destroy({
    where: {
      id: req.params.spotId,
    },
  });

  return res.status(200).json({
    message: "Successfully deleted",
  });
});

//----->GET/ all reviews by spotId<----//

router.get("/:spotId/reviews", async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  const review = await Review.findAll({
    where: {
      spotId: req.params.spotId,
    },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  res.status(200).json(review);
});

//----->POST/ create a review for a spot via spotId<-----//

router.post(
  "/:spotId/reviews",
  validateReview,
  requireAuth,
  async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    // if (!spot.id) {
    //   let err = new Error();
    //   err.message = `Spot couldn't be found`;
    //   err.statusCode = 404;
    //   return res.status(err.statusCode).json(err);
    // }

    const oldReview = await Review.findOne({
      where: {
        spotId: req.params.spotId,
        userId: req.user.id,
      },
    });

    if (oldReview) {
      let err = new Error();
      err.message = `User already has a review for this spot`;
      err.statusCode = 404;
      return res.status(err.statusCode).json(err);
    }

    const { review, stars } = req.body;
    const newReview = await Review.create({
      userId: req.user.id,
      spotId: req.params.spotId,
      review,
      stars,
    });

    res.status(201).json(newReview);
  }
);

//----->GET/ a booking for spot via spotId<-----//
router.get("/:spotId/bookings", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot.id) {
    let err = new Error();
    err.message = `Spot couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  let bookings;
  if (spot.ownerId == req.user.id) {
    bookings = await Booking.findAll({
      where: {
        spotId: req.params.spotId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
  } else {
    bookings = await Booking.findAll({
      where: {
        spotId: req.params.spotId,
      },
    });
  }

  const bookingOrder = bookings.map((booking) => ({
    User: booking.User,
    ...booking.toJSON(),
  }));

  const resObj = { Bookings: [] };

  bookingOrder.forEach((booking) => {
    resObj.Bookings.push(booking);
  });

  res.status(200).json(resObj);
});

//----->POST/ a booking <-----//

router.post(
  "/:spotId/bookings",
  validateBookings,
  requireAuth,
  async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);
    if (!spot.id) {
      let err = new Error();
      err.message = `Spot couldn't be found`;
      err.statusCode = 404;
      return res.status(err.statusCode).json(err);
    }

    const bookings = await Booking.findAll({
      where: {
        spotId: req.params.spotId,
      },
    });

    for (let booking of bookings) {

      const { startDate, endDate } = req.body;
      const newBookingStartDate = new Date(startDate);
      const newBookingEndDate = new Date(endDate);
      const prevBookingStartDate = new Date(booking.startDate);
      const prevBookingEndDate = new Date(booking.endDate);

    //   if (newBookingStartDate <= newBookingEndDate) {
    //     let err = new Error();
    //     err.message = "endDate cannot be on or before startDate";
    //     err.statusCode = 404;
    //     return res.status(err.statusCode).json(err);
    //   }
      if (
        (newBookingStartDate >= prevBookingStartDate &&
          newBookingStartDate <= prevBookingEndDate) ||
        (newBookingEndDate <= prevBookingEndDate &&
          newBookingEndDate > prevBookingStartDate) ||
        (newBookingStartDate <= prevBookingStartDate &&
          newBookingEndDate >= prevBookingEndDate)
      ) {
        let errResult = new Error(
          "Sorry, this spot is already booked for the specified dates"
        );
        return res.status(403).json({
          message: errResult.message,
          errors: {
            startDate: "Start date conflicts with an already existing booking",
            endDate: "End date conflicts with an already existing booking",
          },
        });
      }
    }
    const booking = await Booking.create({
      spotId: req.params.spotId,
      userId: req.user.id,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });

    return res.json(booking);
  }
);

module.exports = router;