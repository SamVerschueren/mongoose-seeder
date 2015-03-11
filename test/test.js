/* jshint expr: true */
'use strict';

/**
 * Test suite for mongoose seeder. Run tests with the following command from
 * the root folder.
 *
 * 		npm test
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  11 Mar. 2015
 */

// module dependencies
var fs = require('fs'),
    mongoose = require('mongoose'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    seeder = require('../index.js');

// Use the should flavour and sinon-chai
var should = chai.should();
chai.use(sinonChai);

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

        describe('Options', function() {
            var data = require('./data/simple.json');

            beforeEach(function() {
                sinon.spy(mongoose.connection.db, 'dropDatabase');
                sinon.spy(mongoose.connection.db, 'dropCollection');
            });

            afterEach(function() {
                mongoose.connection.db.dropDatabase.restore();
                mongoose.connection.db.dropCollection.restore();
            });

            it('Should drop the database if no options are provided', function(done) {
                seeder.seed(data, function(err) {
                    if(err) {
                        return done(err);
                    }

                    mongoose.connection.db.dropDatabase.should.have.been.calledOnce;

                    done();
                });
            });

            it('Should not drop the database if the dropDatabase option is set to false', function(done) {
                seeder.seed(data, {dropDatabase: false}, function(err) {
                    if(err) {
                        return done(err);
                    }

                    mongoose.connection.db.dropDatabase.should.not.have.been.called;

                    done();
                });
            });

            it('Should drop the users collection if the dropCollections option is set to true', function(done) {
                seeder.seed(data, {dropCollections: true}, function(err) {
                    if(err) {
                        return done(err);
                    }

                    mongoose.connection.db.dropCollection.should.have.been.calledWith('users');

                    done();
                });
            });

            it('Should not drop the database if the dropCollections option is set to true', function(done) {
                seeder.seed(data, {dropCollections: true}, function(err) {
                    if(err) {
                        return done(err);
                    }

                    mongoose.connection.db.dropDatabase.should.not.have.been.called;

                    done();
                });
            });
        });
    });

    describe('References', function() {

    });

    describe('Evaluations', function() {

    });
});
