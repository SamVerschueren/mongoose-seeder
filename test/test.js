'use strict';

// module dependencies
var fs = require('fs'),
    mongoose = require('mongoose'),
    seeder = require('../index.js');

var data = require('./data.json');

// bootstrap models
var models_path = __dirname + '/models';
fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) require(models_path + '/' + file);
});

describe('Mongoose Seeder', function() {

    before(function(done) {
        // Set up the connection with the database before running the tests
        mongoose.connect('mongodb://localhost/mongoose-seeder', { server: { socketOptions: { keepAlive: 1 } } }, done);
    });

    after(function(done) {
        // Drop the entire database after execution
        mongoose.connection.db.dropDatabase(done);
    });

    describe('Seeding', function() {

    });

    describe('References', function() {

    });

    describe('Evaluations', function() {

    });
});
