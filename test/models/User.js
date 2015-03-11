'use strict';

// module dependencies
var mongoose = require('mongoose'),
    validator = require('node-mongoose-validator');

var Schema = mongoose.Schema;

// Define the schema of the User model
var UserSchema = new Schema({
    firstName:          {type: String, required: true},
    name:               {type: String, required: true},
    email:              {type: String, required: true},
});

// Validations
UserSchema.path('firstName').validate(validator.notEmpty(), 'Please provide a firstname.');
UserSchema.path('name').validate(validator.notEmpty(), 'Please provide a lastname.');
UserSchema.path('email').validate(validator.notEmpty(), 'The email address can not be blank.');

// Create the model depending on the schema
mongoose.model('User', UserSchema);
