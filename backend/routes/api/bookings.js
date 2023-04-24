

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

//---->GET/all current users bookings<-----//

router.get("/current", requireAuth, async (req, res, next) => {
  
  const bookings = await Booking.findAll({
    where: {
      userId: req.user.id,
    },
    include: [
      {
        model: Spot,
      },
    ],
    
  });

  if (!req.user) {
    let err = new Error();
    err.message = `Booking couldn't be found`;
    err.statusCode = 404;
    return res.status(err.statusCode).json(err);
  }

  if (!bookings) {
    return res.status(404).json({
      message: "Booking couldn't be found",
      statusCode: 404
    });
  }

  

  const bookingsArr = await Promise.all(bookings.map(async booking => {
    const previewImg = await SpotImage.findOne({
      where: {
        spotId: req.spot.id,
        preview: true,
      },
      attributes: ["url"],
    });
    
    return {
      ...booking,
      previewImg: previewImg ? previewImg.url : "No preview image found",
    };
  }));
  

 
  

   return res.json({ Bookings: bookingsArr });
});

//---->UPDATE/ booking <-----//


router.put("/:bookingId", requireAuth, async (req, res) => {
  let { startDate, endDate } = req.body;
  const booking = await Booking.findByPk(req.params.bookingId, {
    where: { userId: req.userId },
  });

  
  
  !booking ? res.status(404).json({ message: "Booking couldn't be found" }) : null;

  
  const newStartDate = Date.parse(booking.startDate);
  const newEndDate = Date.parse(booking.endDate);
  
  if (newEndDate <= newStartDate) {
    return res.status(400).json({
      message: "endDate cannot be on or before startDate",
      statusCode: 400
    });
  }
  
  const currentStartDate = Date.parse(booking.startDate);
  const currentEndDate = Date.parse(booking.endDate); 
  
  if (newEndDate <= currentEndDate)
    return res.status(403).json({ 
      message: "Past bookings can't be modified"
    });
  if (newStartDate >= currentStartDate && newStartDate <= currentEndDate) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
      },
    });
  }
  if (newEndDate <= currentEndDate && newEndDate >= currentStartDate) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        endDate: "End date conflicts with an existing booking",
      },
    });
  }

  await booking.update({
    startDate,
    endDate,
  });
  return res.json(booking);
});
// 

//---->DELETE/ booking <-----//

//---->DELETE/ booking <-----//

router.delete("/:bookingId", requireAuth, async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({
       message: "Booking couldn't be found"
       });
      }
  if (booking.userId !== req.user.id) {
    return res.status(403).json({
       message: "Forbidden"
       });
      }
  const newStartDate = new Date(booking.startDate);
  const newEndDate = new Date(booking.EndDate);
  const currentDate = Date.now();
  if (currentDate <= newStartDate && newEndDate >= currentDate) {
    return res.status(403).json({ 
      message: "Bookings that have been started cannot be deleted" 
    });
  }

  await booking.destroy();
  return res.status(200).json({ message: "Successfully deleted" });
});

  
module.exports = router;
