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
    moment = require('moment'),
    _ = require('lodash'),
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

    var simpleData, refData, evalData, dependencyData;

    beforeEach(function() {
        // Clone all the data so that we can start with a clean sheet every time
        simpleData = _.cloneDeep(require('./data/simple.json'));
        refData = _.cloneDeep(require('./data/references.json'));
        evalData = _.cloneDeep(require('./data/expressions.json'));
        dependencyData = _.cloneDeep(require('./data/dependencies.json'));
    });

    before(function(done) {
        // Set up the connection with the database before running the tests
        mongoose.connect('mongodb://localhost/mongoose-seeder', { server: { socketOptions: { keepAlive: 1 } } }, done);
    });

    after(function(done) {
        // Drop the entire database after execution
        mongoose.connection.db.dropDatabase(function() {
            mongoose.disconnect(done);
        });
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

    describe('References', function() {

        it('Should create a team with one user', function(done) {
            seeder.seed(refData, function(err, dbData) {
                if(err) return done(err);

                dbData.teams.teamA.users.should.have.length(1);

                done();
            });
        });

        it('Should set the correct ID of the user in the team', function(done) {
            seeder.seed(refData, function(err, dbData) {
                if(err) return done(err);

                var user = dbData.teams.teamA.users[0];

                user.user.should.be.eql(dbData.users.foo._id);

                done();
            });
        });

        it('Should set the correct email of the user in the team', function(done) {
            seeder.seed(refData, function(err, dbData) {
                if(err) return done(err);

                var user = dbData.teams.teamA.users[0];

                user.email.should.be.equal(dbData.users.foo.email);

                done();
            });
        });
    });

    describe('Expressions', function() {

        it('Should set the full name to \'Foo Bar\'', function(done) {
            seeder.seed(evalData, function(err, dbData) {
                if(err) return done(err);

                dbData.users.foo.fullName.should.be.equal('Foo Bar');

                done();
            });
        });

        it('Should set a date as birthday', function(done) {
            seeder.seed(evalData, function(err, dbData) {
                if(err) return done(err);

                dbData.users.foo.birthday.should.be.a('Date');

                done();
            });
        });

        it('Should set the number of nationalities to 2', function(done) {
            seeder.seed(evalData, function(err, dbData) {
                if(err) return done(err);

                dbData.users.foo.nationalities.should.be.equal(2);

                done();
            });
        });

        it('Should not throw an error if the expression could not be processed', function(done) {
            evalData.users.foo.fullName = '=firstName + \' \' + name';

            seeder.seed(evalData, function(err, dbData) {
                should.not.exist(err);

                done();
            });
        });

        it('Should just store the expression as is if the expression could not be processed ', function(done) {
            evalData.users.foo.fullName = '=firstName + \' \' + name';

            seeder.seed(evalData, function(err, dbData) {
                if(err) return done(err);

                dbData.users.foo.fullName.should.be.equal('=firstName + \' \' + name');

                done();
            });
        });
    });

    describe('Dependencies', function() {

        it('Should create moment as global variable', function(done) {
            seeder.seed(dependencyData, function(err, dbData) {
                if(err) return done(err);

                should.exist(global.moment);

                done();
            });
        });

        it('Should set the birthday of foo to the 25th of July 1988', function(done) {
            seeder.seed(dependencyData, function(err, dbData) {
                if(err) return done(err);

                dbData.users.foo.birthday.should.be.eql(moment('1988-07-25').toDate());

                done();
            });
        });
    });
});
