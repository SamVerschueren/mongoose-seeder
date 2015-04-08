'use strict';

/**
 * This dummy schema registers the Team model with mongoose that
 * can be used for testing purposes.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  14 Mar. 2015
 */

// module dependencies
var mongoose = require('mongoose'),
    validator = require('node-mongoose-validator');

var Schema = mongoose.Schema;

// Define the schema of the Team model
var TeamSchema = new Schema({
    name:               {type: String, required: true},
    users:              [{
                            _id:        false,
                            user:       {type: Schema.Types.ObjectId, ref: 'User'},
                            email:      {type: String},
                            hobbies:    [{type: String}]
                        }]
});

// This try-catch is added so that it is possible to set a watch
// on the mocha runner. Every time the test runs, it will try
// to create the add the model again
try {
    // Create the model depending on the schema
    mongoose.model('Team', TeamSchema);
}
catch(e) {
    // The model already exists
}
