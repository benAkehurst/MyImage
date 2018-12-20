'use strict';

var debug = require('debug');
var error = debug('reportModel:error');
var log = debug('reportModel:log');

var mongoose = require('mongoose');
var mongooseUniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Image = new Schema({
    imageLink: {
        type: String
    },
    caption: {
        type: String
    },
    likes: {
        type: Number
    },
    userId: {
        type: String
    },
    comments: {
        type: Array
    }
},
{
    timestamps: true
});


Image.set('toJSON', {
    transform: function (doc, ret, options) {
        return ret;
    }
});

module.exports = mongoose.model('Image', Image);