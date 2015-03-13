/* jshint expr: true */
'use strict';

/**
 * Test suite for mongoose seeder. Run tests with the following command from
 * the root folder.
 *
 *     npm test
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

    var simpleData = require('./data/simple.json'),
        dependencyData = require('./data/dependencies.json');

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

            it('Should drop the database if no options are provided', sinon.test(function(done) {
                this.spy(mongoose.connection.db, 'dropDatabase');

                seeder.seed(simpleData, function(err, dbData) {
                    if(err) return done(err);

                    mongoose.connection.db.dropDatabase.should.have.been.calledOnce;

                    done();
                });
            }));

            it('Should not drop the database if the dropDatabase option is set to false', sinon.test(function(done) {
                this.spy(mongoose.connection.db, 'dropDatabase');

                seeder.seed(simpleData, {dropDatabase: false}, function(err) {
                    if(err) return done(err);

                    mongoose.connection.db.dropDatabase.should.not.have.been.called;

                    done();
                });
            }));

            it('Should drop the users collection if the dropCollections option is set to true', sinon.test(function(done) {
                this.spy(mongoose.connection.db, 'dropCollection');

                seeder.seed(simpleData, {dropCollections: true}, function(err) {
                    if(err) return done(err);

                    mongoose.connection.db.dropCollection.should.have.been.calledWith('users');

                    done();
                });
            }));

            it('Should not drop the database if the dropCollections option is set to true', sinon.test(function(done) {
                this.spy(mongoose.connection.db, 'dropDatabase');

                seeder.seed(simpleData, {dropCollections: true}, function(err) {
                    if(err) return done(err);

                    mongoose.connection.db.dropDatabase.should.not.have.been.called;

                    done();
                });
            }));
        });

        describe('Database', function() {

            var User = mongoose.model('User');

            it('Should call the create method of the User model', sinon.test(function(done) {
                this.spy(mongoose.model('User'), 'create');

                seeder.seed(simpleData, function(err) {
                    if(err) return done(err);

                    User.create.should.have.been.calledOnce;

                    done();
                });
            }));

            it('Should call the create method of the User model with the foo object', sinon.test(function(done) {
                this.spy(mongoose.model('User'), 'create');

                seeder.seed(simpleData, function(err) {
                    if(err) return done(err);

                    User.create.should.have.been.calledWith(simpleData.users.foo);

                    done();
                });
            }));

            it('Should create exactly one object in the database', sinon.test(function(done) {
                this.spy(mongoose.model('User'), 'create');

                seeder.seed(simpleData, function(err) {
                    if(err) return done(err);

                    User.count(function(err, count) {
                        if(err) return done(err);

                        count.should.be.equal(1);

                        done();
                    });
                });
            }));

            it('Should create a second object if the dropDatabase property is set to false', sinon.test(function(done) {
                this.spy(mongoose.model('User'), 'create');

                seeder.seed(simpleData, {dropDatabase: false}, function(err) {
                    if(err) return done(err);

                    User.count(function(err, count) {
                        if(err) return done(err);

                        count.should.be.equal(2);

                        done();
                    });
                });
            }));
        });
    });

    describe('Dependencies', function() {

    });

    describe('References', function() {

    });

    describe('Evaluations', function() {

    });
});
