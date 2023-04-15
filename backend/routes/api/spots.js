const express = require('express');
const { User, Spot, Review, SpotImage, ReviewImage, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require("sequelize");

const bcrypt = require("bcryptjs");
const router = express.Router();



const spotsValidater = [
    
    check("address")
      .exists({ checkFalsy: true })
      .withMessage("Street address is required"),
    check("city")
      .exists({ checkFalsy: true })
      .withMessage("City is required"),
    check("state")
      .exists({ checkFalsy: true })
      .withMessage("State is required"),
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
      .exists({ checkFalsy: true })
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

  const validateReviews = [
    check("price")
      .exists({ checkFalsy: true })
      .withMessage("Review text is required"),
    check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors
  ];

  const queryValidater = [
    check("page")
      .isInt({ min: 1 })
      .withMessage("Page must be greater than or equal to 1"),
    check("size")
      .isInt({ min: 1 })
      .withMessage("Size must be greater than or equal to 1"),
    check("maxLat")
      .isFloat({ max: 90 })
      .withMessage("Max latitude is invalid"),
    check("minLat")
      .isFloat({ min: -90})
      .withMessage("Minimum latitude is invalid"),
    check("minLng")
      .isFloat({ min: -180})
      .withMessage("Minimum longitude is invalid"),
    check("maxLng")
      .isFloat({ max: 180 })
      .withMessage("Maximum longitude is invalid"),
    check("minPrice")
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be greater than or equal to 0"),
    check("maxPrice")
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be greater than or equal to 0"),
    handleValidationErrors
  ];

  
router.get('/', queryValidater, async (req, res, next) => {

    
    let { page, size, maxPrice, minPrice, maxLat, minLat, maxLng, minLng } = req.query

    

    page = Number(page);
    size = Number(size);

    if (!page) page = 1
    if (page > 10) page = 10;
    if (!size) size = 20
    if (size > 20) size = 20;

    let pagination = {}
    if (parseInt(page) >= 1 && parseInt(size) >= 1) {
        pagination.limit = size
        pagination.offset = (page - 1) * size
    }

const search = {
    where: {},
    include: [
        {
            model: Review,
            attributes: ['stars']
        },
        {
            model: SpotImage,
            attributes: ['url', 'preview']
        }
    ],
    ...pagination,
};



if (!maxPrice && minPrice) {
    search.where.price = {
        [Op.gte]: minPrice
    }
};

if (maxPrice && minPrice) {
    search.where.price = {
        [Op.and]: {
            [Op.lte]: maxPrice,
            [Op.gte]: minPrice
        }
    }
};

if (maxPrice && !minPrice) {
    search.where.price = {
        [Op.lte]: maxPrice
    }
};


if (maxLng && minLng) {
    search.where.lng = {
        [Op.and]: {
            [Op.lte]: maxLng,
            [Op.gte]: minLng
        }
    }
};

if (!maxLng && minLng) {
    search.where.lng = {
        [Op.gte]: minLng
    }
};

if (maxLng && !minLng) {
    search.where.lng = {
        [Op.lte]: maxLng
    }
};



if (maxLat && minLat) {
    search.where.lat = {
        [Op.and]: {
            [Op.lte]: maxLat,
            [Op.gte]: minLat
        }
    }
};

if (!maxLat && minLat) {
    search.where.lat = {
        [Op.gte]: minLat
    }
};

if (maxLat && !minLat) {
    search.where.lat = {
        [Op.lte]: maxLat
    }
};

let getSpots = await Spot.findAll(search);

    let spotsRes = [];

    getSpots.forEach(spot => {
        let sameSpot = spot.toJSON();

        let totalRev = spot.Reviews.length;
        let allStars = 0;

        spot.Reviews.forEach((review) => {
            allStars += review.stars
        })

        let avg = allStars / totalRev;

        if (!avg) {
            avg = "There are no current ratings for this spot"
        };

        sameSpot.avgRating = avg;

        if (sameSpot.SpotImages.length > 0) {
            for (let i = 0; i < sameSpot.SpotImages.length; i++) {
                if (sameSpot.SpotImages[i].preview === true) {
                    sameSpot.previewImage = sameSpot.SpotImages[i].url;
                }
            }
        };

        if (!sameSpot.previewImage) {
            sameSpot.previewImage = "There are no preview images for this spot";
        };

        delete sameSpot.SpotImages
        delete sameSpot.Reviews;
        spotsRes.push(sameSpot);
    });

    if (!spotsRes.length) {
        res.json("There are no spots matching your query")
    };


    res.json({
        Spots: spotsRes,
        page,
        size
    });

})

let allSpots = await Spot.findAll(query);

    let spotsResults = [];

    allSpots.forEach(spot => {
        let matchedSpot = spot.toJSON();

        let totalReviews = spot.Reviews.length;
        let totalStars = 0;

        spot.Reviews.forEach((review) => {
            totalStars += review.stars
        })

        let avg = totalStars / totalReviews;

        if (!avg) {
            avg = "There are no current ratings for this spot"
        };

        matchedSpot.avgRating = avg;

        if (matchedSpot.SpotImages.length > 0) {
            for (let i = 0; i < matchedSpot.SpotImages.length; i++) {
                if (matchedSpot.SpotImages[i].preview === true) {
                    matchedSpot.previewImage = matchedSpot.SpotImages[i].url;
                }
            }
        };

        if (!matchedSpot.previewImage) {
            matchedSpot.previewImage = "There are no preview images for this spot";
        };

        delete matchedSpot.SpotImages
        delete matchedSpot.Reviews;
        spotsResults.push(matchedSpot);
    });

    if (!spotsResults.length) {
        res.json("There are no spots matching your query")
    };


    res.json({
        Spots: spotsResults,
        page,
        size
    });
