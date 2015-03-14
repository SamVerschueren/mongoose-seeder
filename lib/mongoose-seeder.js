/* jshint evil:true */
'use strict';

/**
 * This module seeds the database with data that should be in the database
 * before the tests should start.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  04 Mar. 2015
 */

// module dependencies
var mongoose = require('mongoose'),
    async = require('async'),
    _ = require('lodash');

module.exports = (function() {

    // The default options
    var DEFAULT_OPTIONS = {
        dropDatabase: true,
        dropCollections: false
    };

    var _this = {
        result: {},
        options: {},
        /**
         * The internal method for seeding the database.
         *
         * @param  {Object}   data The data that should be seeded.
         * @param  {Function} done The method that should be called when the seeding is done
         */
        _seed: function(data, done) {
            // Retrieve all the dependencies
            _.forEach(data._dependencies || {}, function(value, key) {
                if(global[key] !== undefined) {
                    return;
                }

                global[key] = require(value);
            });

            // Remove the dependencies property
            delete data._dependencies;

            // Iterate over all the data objects
            async.eachSeries(Object.keys(data), function(key, next) {
                _this.result[key] = {};

                var value = data[key];

                try {
                    if(!value._model) {
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
                    return _this._eval.call(parent, value.substr(1));
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
                result = _this.result[keys.shift()];

            if(!result) {
                return '';
            }

            while(keys.length > 0) {
                var k = keys.shift();

                result = result[k];
            }

            if(_.isPlainObject(result)) {
                return result._id || '';
            }

            return result;
        },
        /**
         * This helper method for eval makes sure it is possible to call eval in
         * a certain context. For instance, if you call eval like this
         *
         *     var a = {hello: 'world'};
         *     _eval.call(a, 'this.hello');
         *
         * This will return the 'world' string because the context of the eval is set
         * to the 'a' object
         *
         * @param  {String} expr The expression to be evaluated.
         * @return {*}           The result of the evaluated expression.
         */
        _eval: function(expr) {
            return eval(expr);
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

            // Clear earlier results and options
            _this.result = {};
            _this.options = {};

            // Default the callback to a noop function so that we don't have to check later on
            callback = callback || function() {};

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
                        return callback(err);
                    }

                    // Start seeding when the database is dropped
                    _this._seed(_.cloneDeep(data), callback);
                });
            }
            else {
                // Do not drop the entire database, start seeding
                _this._seed(_.cloneDeep(data), callback);
            }
        }
    };
})();
