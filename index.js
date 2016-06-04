'use strict';

/**
 * This module seeds the database with data that should be in the database
 * before the tests should start.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  4 Mar. 2015
 */

// module dependencies
var vm = require('vm'),
    mongoose = require('mongoose'),
    async = require('async'),
    _ = require('lodash'),
    Q = require('q'),
    objectAssign = require('object-assign');

module.exports = (function() {

    // The default options
    var DEFAULT_OPTIONS = {
        dropDatabase: true,
        dropCollections: false
    };

    var _this = {
        result: {},
        options: {},
        sandbox: undefined,
        /**
         * The internal method for seeding the database.
         *
         * @param  {Object}   data The data that should be seeded.
         * @param  {Function} done The method that should be called when the seeding is done
         */
        _seed: function(data, done) {
            try {
                // Retrieve all the dependencies
                _.forEach(data._dependencies || {}, function(value, key) {
                    if(this.sandbox[key] !== undefined) {
                        // Do nothing if the dependency is already defined
                        return;
                    }

                    this.sandbox[key] = module.parent.require(value);
                }.bind(this));

                // Remove the dependencies property
                delete data._dependencies;
            }
            catch(e) {
                // Stop execution and return the MODULE_NOT_FOUND error
                return done(e);
            }

            // Iterate over all the data objects
            async.eachSeries(Object.keys(data), function(key, next) {
                _this.result[key] = {};

                var value = data[key];

                try {
                    if(!value._model) {
                        // Throw an error if the model could not be found
                        throw new Error('Please provide a _model property that describes which database model should be used.');
                    }

                    var modelName = value._model;

                    // Remove model and unique properties
                    delete value._model;

                    // retrieve the model depending on the name provided
                    var Model = mongoose.model(modelName);

                    async.series([
                        function(callback) {
                            if(_this.options.dropCollections === true) {
                                // Drop the collection
                                mongoose.connection.db.dropCollection(Model.collection.name, function(err) {
                                    callback();
                                });
                            }
                            else {
                                callback();
                            }
                        },
                        function(callback) {
                            async.eachSeries(Object.keys(value), function(k, innerNext) {
                                var modelData = value[k],
                                    data = _this._unwind(modelData);

                                // Create the model
                                Model.create(data, function(err, result) {
                                    if(err) {
                                        // Do not stop execution if an error occurs
                                        return innerNext(err);
                                    }

                                    _this.result[key][k] = result;

                                    innerNext();
                                });
                            }, callback);
                        }
                    ], next);
                }
                catch(err) {
                    // If the model does not exist, stop the execution
                    return next(err);
                }
            }, function(err) {
                if(err) {
                    // Make sure to not return the result
                    return done(err);
                }

                done(undefined, _this.result);
            });
        },
        /**
         * This method unwinds an object and iterates over every property in the object.
         * It will then parse the value of the property in order to search for references
         * and make a reference to the correct object.
         *
         * @param  {Object} obj The object to parse.
         * @return {Object}     The object with the correct references.
         */
        _unwind: function(obj) {
            return _.mapValues(obj, function(value) {
                return _this._parseValue(obj, value);
            });
        },
        /**
         * This method parses every value. If the value is an object it will unwind
         * that object as well. If the value is a reference (value starting with ->),
         * then it will find the reference to that object.
         *
         * @param  {Object} parent  The object for which the value should be parsed.
         * @param  {*}      value   The value that should be parsed.
         * @return {*}              The parsed value.
         */
        _parseValue: function(parent, value) {
            if(_.isPlainObject(value)) {
                // Unwind the object
                return _this._unwind(value);
            }
            else if(_.isArray(value)) {
                // Iterate over the array
                return _.map(value, function(val) {
                    return _this._parseValue(parent, val);
                });
            }
            else if(_.isString(value) && value.indexOf('=') === 0) {
                // Evaluate the expression
                try {
                    // Assign the object to the _this property
                    var base = {
                       '_this': parent
                    };

                    // Create a new combined context
                    var ctx = vm.createContext(objectAssign(base, _this.sandbox));

                    // Run in the new context
                    return vm.runInContext(value.substr(1).replace(/this\./g, '_this.'), ctx);
                }
                catch(e) {
                    return value;
                }
            }
            else if(_.isString(value) && value.indexOf('->') === 0) {
                // Find the reference to the object
                return _this._findReference(value.substr(2));
            }

            return value;
        },
        /**
         * This method searches for the _id associated with the object represented
         * by the reference provided.
         *
         * @param  {String} ref The string representation of the reference.
         * @return {String}     The reference to the object.
         */
        _findReference: function(ref) {
            var keys = ref.split('.'),
                key = keys.shift(),
                result = _this.result[key];

            if(!result) {
                // If the result does not exist, return an empty
                throw new TypeError('Could not read property \'' + key + '\' from undefined');
            }

            // Iterate over all the keys and find the property
            while((key = keys.shift())) {
                result = result[key];
            }

            if(_.isObject(result) && !_.isArray(result)) {
                // Test if the result we have is an object. This means the user wants to reference
                // to the _id of the object.
                if(!result._id) {
                    // If no _id property exists, throw a TypeError that the property could not be found
                    throw new TypeError('Could not read property \'_id\' of ' + JSON.stringify(result));
                }

                return result._id;
            }

            return result;
        }
    };

    return {
        /**
         * Start seeding the database.
         *
         * @param  {Object}   data     The data object that should be inserted in the database.
         * @param  {Object}   options  The options object to provide extras.
         * @param  {Function} callback The method that should be called when the seeding is done.
         */
        seed: function(data, options, callback) {
            if(_.isFunction(options)) {
                // Set the correct callback function
                callback = options;
                options = {};
            }

            // Create a deferred object for the promise
            var def = Q.defer();

            // If no callback is provided, use a noop function
            callback = callback || function() {};

            // Clear earlier results and options
            _this.result = {};
            _this.options = {};
            _this.sandbox = vm.createContext();

            // Defaulting the options
            _this.options = _.extend(_.clone(DEFAULT_OPTIONS), options);

            if(_this.options.dropCollections === true && _this.options.dropDatabase === true) {
                // Only one of the two flags can be turned on. If both are true, this means the
                // user set the dropCollections itself and this should have higher priority then
                // the default values.
                _this.options.dropDatabase = false;
            }

            if(_this.options.dropDatabase === true) {
                // Make sure to drop the database first
                mongoose.connection.db.dropDatabase(function(err) {
                    if(err) {
                        // Stop seeding if an error occurred
                        return done(err);
                    }

                    // Start seeding when the database is dropped
                    _this._seed(_.cloneDeep(data), done);
                });
            }
            else {
                // Do not drop the entire database, start seeding
                _this._seed(_.cloneDeep(data), done);
            }

            /**
             * This method will be invoked when the seeding is completed or when something
             * went wrong. This method will then call the callback and rejects or resolves
             * the promise object. This way, users of the library can use both.
             *
             * @param  {*}        err    [description]
             * @param  {Object}   result [description]
             */
            function done(err, result) {
                if(err) {
                    def.reject(err);
                    callback(err);
                    return;
                }

                def.resolve(result);
                callback(undefined, result);
            }

            // Return the promise
            return def.promise;
        }
    };
})();