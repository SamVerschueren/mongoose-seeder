# mongoose-seeder

[![Build Status](http://img.shields.io/travis/SamVerschueren/mongoose-seeder.svg)](https://travis-ci.org/SamVerschueren/mongoose-seeder)
[![Coverage Status](http://img.shields.io/coveralls/SamVerschueren/mongoose-seeder/master.svg)](https://coveralls.io/r/SamVerschueren/mongoose-seeder)

When testing an application, you always want to start with the same database. It is a lot of work to manually create
dummy data and link them together. When you want extra data to test with, you'll have to create your mongoose objects
manually in the ```before``` method of the entire testsuite.

This library offers a nice, clean and elegant solution that will create the dummy data objects from a JSON file.

## Install

```
npm install mongoose-seeder
```

## How to use

```JavaScript
var seeder = require('mongoose-seeder'),
    data = require('./data.json');

seeder.seed(data).then(function(dbData) {
    // The database objects are stored in dbData
}).catch(function(err) {
    // handle error
});
```

The ```seed``` function has two options.
* **data**: The JSON objects that will be used to create the mongo documents.
* **options**: [optional] Extra options that alter the behaviour. The default behaviour is drop the entire database before seeding it again.

### Callbacks

Although, promises are the preferred way of using the library. It's also possible to use a callback function as extra parameter
in the seed function.

```JavaScript
seeder.seed(data, function(err, dbData) {
    // ...
})
```

So actually, the seed function has three options if you want to use it with a callback. You can still provide the extra options
as second parameter in the seed function.

### Behaviour

You can also provide extra options that will indicate if the drop strategy. You can choose if the library should drop
the entire database before seeding it again. Another option is to only drop the collections that are being seeded. This
offers the flexibility that you can manually add data to the database that keeps persisted. The third option is to do
nothing and just add the data to the collections. The default behaviour is to drop the entire database before seeding.

#### Drop database

By setting this property to ```true```, it will drop the entire database before creating the documents again. This
is the default behaviour. If you set this property to ```false```, it will do nothing and just tries to append the
documents to the collection.

```JavaScript
// Drop the entire database (default behaviour)
seeder.seed(data, {dropDatabase: true}).then(function(dbData) {
    // ...
}).catch(function(err) {
    // handle error
});
```

#### Drop collections

By setting this option to ```true```, it will only drop the collections that are being seeded. If you have two collections
for example, but only one collection is filled by the seeder, only that collection will be dropped.

```JavaScript
// Drop the entire database (default behaviour)
seeder.seed(data, {dropCollections: true}).then(function(dbData) {
    // ...
}).catch(function(err) {
    // handle error
});
```

### .json

#### Simple data

How does a json file looks like? Take a look at this simple example.

```json
{
    "users": {
        "_model": "User",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com"
        }
    }
}
```

It will try to find the mongoose model ```User``` and calls the ```create``` method for the foo object.

The reason that this isn't an array of items, is because in the callback method, the second parameter returns the database object. This
will look like this.

```json
{
    "users": {
        "foo": {
            "_id": "550192679a3c881f4e7dc526",
            "__v": 0,
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com"
        }
    }
}
```

So the foo user can be accessed as following.

```JavaScript
// Drop the entire database (default behaviour)
seeder.seed(data, {dropCollections: true}, function(err, dbData) {
    var foo = dbData.users.foo;
});
```

#### References

Most of the time, you have documents that have a reference to another document or to properties from another
document. It is possible to do that with this library.

```json
{
    "users": {
        "_model": "User",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com"
        }
    },
    "teams": {
        "_model": "Team",
        "teamA": {
            "name": "Team A",
            "users": [
                {
                    "user": "->users.foo",
                    "email": "->users.foo.email"
                }
            ]
        }
    }
}
```

A team holds a list of users with the ```_id``` and the ```email``` of that user. Notice that writing ```->users.foo``` is identical
to writing ```->users.foo._id```.

Another thing that should be taken into account is that it's not possible to do a forward reference. This means that in this case,
a user cannot reference a team. The reason for this is that at the time the user is being created, the team does not yet exist. This
would be a nice feature for the future.

#### Expressions

Sometimes you will need something as an expression, for instance to set the birthday of the user.

```json
{
    "users": {
        "_model": "User",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com",
            "birthday": "=new Date(1988, 08, 16)"
        }
    }
}
```

Every statement that is preceded by an ```=```-sign will be evaluated by the native ```eval()``` method of JavaScript.

We can also bring it a step further and reference to the object itself. For instance, if we want to store the full name of
the user aswell, instead of adding it manually, you can do something like this.

```json
{
    "users": {
        "_model": "User",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "fullName": "=this.firstName + ' ' + this.lastName",
            "email": "foo@bar.com",
            "birthday": "=new Date(1988, 08, 16)"
        }
    }
}
```

The result of the ```fullName``` expression will be ```Foo Bar```. So every evaluation is evaluated in it's own context.

#### Dependencies

What if we don't want to make use of the plain old ```Date``` object, but instead use something like ```moment```. This is possible by
adding a list of dependencies.

```json
{
    "_dependencies": {
        "moment": "moment"
    },
    "users": {
        "_model": "User",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com",
            "birthday": "=moment('1988-08-16')"
        }
    }
}
```

If you are using a dependency in your json file, be sure to install it as dependency in your project. If not, it will stop the execution
and return a ```MODULE_NOT_FOUND``` error in the callback function.

## Contributors

- Sam Verschueren [<sam.verschueren@gmail.com>]

## License (MIT)

```
Copyright (c) 2015 Sam Verschueren <sam.verschueren@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
