//
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   D E P E N D E N C I E S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const request = require('request');
const async = require('async');
const axios = require('axios');
//
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: S E R V E R   C O N F I G U R A T I O N : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//

const app = express();
require('dotenv').config();
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
const UserModel = require('./models/userModel');
const ImageModel = require('./models/imageModel');
const CommentModel = require('./models/commentModel');

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
app.post('/registerUser', (req, res, next) => {
  var data = req.body;
  var user = new UserModel({
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
app.post('/login', (req, res, next) => {
  var data = req.body;
  UserModel.findOne({
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

/**
 * Uploads a new image
 * saves image item in the DB with id of which user uploaded the image
 * @param {*} req
 * @param {*} res
 */
app.post("/uploadNewImage", (req, res) => {
  const data = req.body;
  const newImage = new ImageModel({
    imageLink: data.imageLink,
    caption: data.caption,
    likes: 0,
    userId: data.userId,
    comments: []
  });
  newImage.save((err, image) => {
    const imageId = image._id;
    const userId = image.userId;
    UserModel.findOneAndUpdate({ _id: userId }, (err, user) => {
      user.uploadedImages.push(imageId);
    });
  }, 
  res.send({ status: true, message: "Image uploaded successfully" }));
});

/**
 * Gets the fist 10 images in all images array
 * @param {*} req
 * @param {*} res
 */
app.post("/retreiveFirstTenImages", (req, res) => {
  const path = "https://api.unsplash.com/photos/?client_id=" + process.env.UNSPLASH_ID;
  request(path, (err, data) => {
    if (err) {
      res.send({
        success: false,
        message: "Images not got succesfully"
      });
    }
    let bodyData = convertData(JSON.parse(data.body));
    res.send({
      success: true,
      message: "Images got succesfully",
      data: bodyData
    });
  });
});

function convertData(data) {
  const images = data;
  return images.map(d => ({
    imageUrl: d.urls.regular,
    imageId: d.id,
    date: d.created_at,
    likes: d.likes,
    description: d.desciption,
    userName: d.user.name,
    userLink: d.user.links.self
  }));
}

/**
 * Gets next 10 images in the images array
 * @param {*} req
 * @param {*} res
 */
app.post('/retreiveNextTenImages/:pastRetreiveNumber', (req, res) => {
  // look at past retreive nunber and count though array
  // send back next 10 images and past number + 10
});

/**
 * Likes an Image
 * @param {*} req
 * @param {*} res
 */
app.post('/likeImage/:imageId', (req, res) => {
// find image and add 1 like to number
// find user how liked and add image id to array
});

/**
 * Dislikes an image
 * @param {*} req
 * @param {*} res
 */
app.post('/dislikeImage/:imageId', (req,res) => {
  // find image and decress 1 to number
  // find user and remove id from array
});

/**
 * Adds a comment to an image
 * @param {*} req
 * @param {*} res
 */
app.post('/addCommentToImage/:imageId', (req, res) => {
  // find image and add comment to array of comments
  // find user and add comment id to user array
});

/**
 * remove a comment from an image
 * @param {*} req
 * @param {*} res
 */
app.post('/removeCommentFromImage/:imageId', (req, res) => {
  // find image and remove comment
  // find user and remove comment
});

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
//  * removes an antique in the database
//  * @param {*} req
//  * @param {*} res
//  * @param {*} next
//  */
// app.post("/deleteAntique", function (req, res, next) {
//   var routeId = req.body.data.route;
//   var userId = req.body.data.user;
  // async.parallel({
  //     updateRoute: function (callback) {
  //       Route.findByIdAndRemove(routeId).exec(function (err, updatedRoute) {
  //         callback(err, updatedRoute);
  //       });
  //     },
  //     updatedUser: function (callback) {
  //       User.findByIdAndUpdate(
  //         userId, {
  //           $pull: {
  //             savedRoutes: routeId
  //           }
  //         }, {
  //           new: true
  //         }
  //       ).exec(function (err, updatedUser) {
  //         callback(err, updatedUser);
  //       });
  //     }
  //   },
  //   function (err, results) {
  //     if (err) {
  //       next(err);
  //       return;
  //     }
  //     res.send({
  //       success: true,
  //       user: results.updatedUser
  //     });
  //   }
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