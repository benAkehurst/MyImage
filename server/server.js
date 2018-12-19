//
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   D E P E N D E N C I E S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const request = require('request');
const rp = require('request-promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const async = require("async");
//
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   C O N F I G U R A T I O N : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//

const app = express();
require('dotenv').config()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
  next();
});
app.use(express.static(path.join(__dirname, 'dist')));

// TODO: UNCOMMENT TO WORK WITH DB
// Connect to DB with mongoose
mongoose.Promise = global.Promise;
// Local DB
mongoose.connect("mongodb://localhost:27017/insta-db", function (err) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("Connected to Database")
    }
});
// Live DB
// mongoose.connect(process.env.DB_CONNECT, function (err) {
//   if (err) {
//     console.log("Error: " + err);
//   } else {
//     console.log("Connected to Database")
//   }
// });

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

//
// ──────────────────────────────────────────────────────── DOWNLOAD DATABASE ─────
//


//
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   R O U T E S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// ─── MODELS ─────────────────────────────────────────────────────────────────────
//
const User = require('./models/userModel');
const Image = require('./models/imageModel');
const Comment = require('./models/commentModel');

//
// ─────────────────────────────────────────────────────────────────── MODELS ─────
//
//
// ─── LOGIN AND REGISTER ─────────────────────────────────────────────────────────
//
/**
 * Registers a user in the database
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
app.post('/registerUser', function (req, res, next) {
  var data = req.body;
  var user = new User({
    name: data.name,
    email: data.email,
    password: bcrypt.hashSync(data.password, 10)
  });
  user.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        title: 'An error occurred with sign up',
        error: err
      });
    }
    var token = jwt.sign({
      user: user
    }, 'secret', {
      expiresIn: 7200
    });
    res.status(201).json({
      message: 'User created',
      success: true,
      token: token,
      obj: result
    });
  });
});

/**
 * Logs in a user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
app.post('/login', function (req, res, next) {
  var data = req.body;
  User.findOne({
    email: data.email
  }, function (err, user) {
    if (err) {
      return res.status(500).json({
        success: false,
        title: 'An error occurred',
        error: err
      });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        title: 'Login failed',
        error: {
          message: 'Invalid login credentials'
        }
      });
    }
    if (!bcrypt.compareSync(data.password, user.password)) {
      return res.status(401).json({
        success: false,
        title: 'Login failed',
        error: {
          message: 'Invalid login credentials'
        }
      });
    }
    var token = jwt.sign({
      user: user
    }, 'secret', {
      expiresIn: 7200
    });
    res.status(200).json({
      message: 'Successfully logged in',
      success: true,
      token: token,
      obj: user
    });
  });
});


//
// ─── UPLOAD IMAGE ─────────────────────────────────────────────
// ─── LIKE IMAGE ─────────────────────────────────────────────
// ─── UNLIKE IMAGE ─────────────────────────────────────────────
// ─── COMMENT ON IMAGE ─────────────────────────────────────────────
// ─── DELETE COMMENT ON IMAGE ─────────────────────────────────────────────
// ─── GET FIRST 10 IMAGES ─────────────────────────────────────────────
// ─── GET SUBSIQUENT 10 IMAGES ─────────────────────────────────────────────
// ─── UPLOAD USER IMAGE ─────────────────────────────────────────────
//

//
// ─── DATABASE ACTIONS ROUTES ───────────────────────────────────────────────────────
//
// /**
//  * Gets all the antiques in the database
//  * @param {*} req
//  * @param {*} res
//  */
// app.post("/getAllAntiques", function (req, res) {
//   Antique.find({})
//     .exec(function (err, antiques) {
//       if (err) {
//         console.log("Error: " + " " + err);
//         res.send({
//           success: false,
//           message: err
//         });
//       } else {
//         // console.log(antiques);
//         res.send({
//           success: true,
//           data: antiques
//         })
//       }
//     })
// });

// /**
//  * Gets one antique in the database
//  * @param {*} req
//  * @param {*} res
//  * @param {*} next
//  */
// app.post("/getAntique", function (req, res, next) {
//   Antique.findById({
//       _id: req.body.data.antique
//     })
//     .exec(function (err, antique) {
//       if (err) {
//         console.log("Error: " + " " + err);
//         res.send({
//           success: false,
//           message: err
//         });
//       } else {
//         // console.log(antique);
//         res.send({
//           success: true,
//           data: antique
//         })
//       }
//     })
// });

// /**
//  * Saves a new Antique to the user model in the database
//  * @param {*} req
//  * @param {*} res
//  * @param {*} next
//  */
// app.post("/saveNewAntique", function (req, res, next) {
//   const data = req.body.data;
//   const newAntique = new Antique({
//     name: data.antique.name,
//     artist: data.antique.artist,
//     year: data.antique.year,
//     category: data.antique.category.category,
//     subCategory: data.antique.subCategory,
//     signed: data.antique.signed,
//     boughtPrice: data.antique.boughtPrice,
//     soldPrice: data.antique.soldPrice,
//     value: data.antiqueValue,
//     image: data.antique.image,
//     description: data.antique.description,
//     condition: data.antique.condition,
//     width: data.antique.width,
//     height: data.antique.height,
//     depth: data.antique.depth,
//     material: data.antique.material,
//     location: data.antique.location,
//     provenance: data.antique.provenance,
//     provenanceImage: data.antique.provenanceImage,
//     status: data.antique.status,
//   });
//   newAntique.save(function (err, antique) {
//     if (err) {
//       return next(err);
//       res.send(err);
//     }
//     res.send({
//       success: true,
//       message: 'antique saved'
//     });
//   });
// });

// /**
//  * Edits an antique in the database
//  * @param {*} req
//  * @param {*} res
//  * @param {*} next
//  */
// app.post("/editAntique/:_id", function (req, res, next) {
//   var updatedAntique = req.body.data.antique;
//   var updatedValue = req.body.data.antiqueValue
//   async.parallel({
//       updateAntique: function (callback) {
//         Antique.findByIdAndUpdate(req.params._id, {
//           updatedAntique
//         }).exec(function (err, serverUpdatedAntique) {
//           callback(err, serverUpdatedAntique);
//         });
//       },
//       updateAntiqueValue: function (callback) {
//         Antique.findByIdAndUpdate(
//           req.params._id, {
//             $push: {
//               value: updatedValue
//             }
//           }, {
//             new: true
//           }
//         ).exec(function (err, finalUpdatedAntique) {
//           callback(err, finalUpdatedAntique);
//         });
//       }
//     },
//     function (err, antique) {
//       if (err) {
//         next(err);
//         return;
//       }
//       res.send({
//         success: true,
//         antique: antique
//       });
//     }
//   )
// });

// /**
//  * removes an antique in the database
//  * @param {*} req
//  * @param {*} res
//  * @param {*} next
//  */
// app.post("/deleteAntique", function (req, res, next) {
//   var routeId = req.body.data.route;
//   var userId = req.body.data.user;
//   async.parallel({
//       updateRoute: function (callback) {
//         Route.findByIdAndRemove(routeId).exec(function (err, updatedRoute) {
//           callback(err, updatedRoute);
//         });
//       },
//       updatedUser: function (callback) {
//         User.findByIdAndUpdate(
//           userId, {
//             $pull: {
//               savedRoutes: routeId
//             }
//           }, {
//             new: true
//           }
//         ).exec(function (err, updatedUser) {
//           callback(err, updatedUser);
//         });
//       }
//     },
//     function (err, results) {
//       if (err) {
//         next(err);
//         return;
//       }
//       res.send({
//         success: true,
//         user: results.updatedUser
//       });
//     }
//   );
// });

//
// ───────────────────────────────────────────────────── DATABASE ACTIONS ROUTES ─────
//

//
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   R U N   C O M M A N D S   A N D   P O R T   A C C E S S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Get port from environment and store in Express.
const port = process.env.PORT || '3000';
app.set('port', port);
// Creates an HTTP server
const server = http.createServer(app);
// Listen on provided port, on all network interfaces.
server.listen(port, () => console.log(`API running on localhost:${port}`));