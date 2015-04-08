'use strict';

/**
 * This dummy schema registers the User model with mongoose that
 * can be used for testing purposes.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  11 Mar. 2015
 */

// module dependencies
var mongoose = require('mongoose'),
    validator = require('node-mongoose-validator');

var Schema = mongoose.Schema;

// Define the schema of the User model
var UserSchema = new Schema({
    firstName:          {type: String, required: true},
    name:               {type: String, required: true},
    fullName:           {type: String},
    email:              {type: String, required: true},
    birthday:           {type: Date},
    nationalities:      {type: Number},
    hobbies:            [{type: String}]
});

// Validations
UserSchema.path('firstName').validate(validator.notEmpty(), 'Please provide a firstname.');
UserSchema.path('name').validate(validator.notEmpty(), 'Please provide a lastname.');
UserSchema.path('email').validate(validator.notEmpty(), 'The email address can not be blank.');

// This try-catch is added so that it is possible to set a watch
// on the mocha runner. Every time the test runs, it will try
// to create the add the model again
try {
    // Create the model depending on the schema
    mongoose.model('User', UserSchema);
}
catch(e) {
    // The model already exists
}
