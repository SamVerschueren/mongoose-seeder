# mongoose-seeder

[![Build Status](https://travis-ci.org/SamVerschueren/mongoose-seeder.svg)](https://travis-ci.org/SamVerschueren/mongoose-seeder)

When testing an application, you always want to start with the same database. It is a lot of work to manually create
dummy data and link them together. When you want extra data to test with, you'll have to add it manually to before the
tests run.

This library offers a solution that will create your dummy data from a JSON file.

## Install

**not yet available**

## How to use

The most simple example looks like this.

```JavaScript
var seeder = require('mongoose-seeder'),
    data = require('./data.json');

seeder.seed(data, function(err, dbData) {
    // ...
});
```

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
seeder.seed(data, {dropDatabase: true}, function(err, dbData) {
    // ...
});
```

#### Drop collections

By setting this option to ```true```, it will only drop the collections that are being seeded. If you have two collections
for example, but only one collection is filled by the seeder, only that collection will be dropped.

```JavaScript
// Drop the entire database (default behaviour)
seeder.seed(data, {dropCollections: true}, function(err, dbData) {
    // ...
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

Why isn't this an array of items? This is because in the callback method, the second parameter returns the database object. This
will look like this.

```json
{
    "users": {
        "foo": {
            "_id": ObjectId("550192679a3c881f4e7dc526"),
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

**TODO**

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

If you are using a dependency, be sure to install it as dependency in your project. If not, it will provide you with the error
that ```moment``` could not be found.

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
