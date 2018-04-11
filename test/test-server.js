const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {Animal} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
chai.use(require('chai-datetime'));

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedAnimalData() {
  console.info('seeding animal data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateAnimalData());
  }
  // this will return a promise
  return Animal.insertMany(seedData);
}

// generate an object represnting an animal
// can be used to generate seed data for db
// or request.body data
function generateAnimalData() {
  var n = Math.floor(Math.random()*5)+1;
  var weights = [];
  for (var i = 0; i < n; i++){
    weights.push({weight: faker.finance.amount(100,400,1), weigh_date: faker.date.recent()});
  }
  return {
    weights: weights
  };
}


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  data from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Animal API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedAnimalData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedAnimalData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET animal endpoint', function() {

    it('should return all existing animals', function() {
      // strategy:
      //    1. get back all animals returned by by GET request to `/animal`
      //    2. prove res has right status, data type
      //    3. prove the number of animals we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/animal')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);
          return Animal.count();
        })
        .then(function(count) {
            console.log(res.body.length);
          res.body.length.should.equal(count);
        });
    });


    it('should return animals with right fields', function() {
      // Strategy: Get back all animals, and ensure they have expected keys

      let resAnimal;
      return chai.request(app)
        .get('/animal')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(animal) {
            animal.should.be.a('object');
            animal.should.include.keys(
              '_id', 'weights');
          });
          resAnimal = res.body[0];
          return Animal.findById(resAnimal._id);
        })
        .then(function(animal) {
          resAnimal.weights[0].weight.should.equal(animal.weights[0].weight);
          var date = new Date(resAnimal.weights[0].weigh_date);
          date.should.equalTime(animal.weights[0].weigh_date);
        });
    });
  });
   describe('GET estimated weight endpoint', function() {

    it('should return estimated total weight of all existing animals', function() {
      // strategy:
      //    1. get back sum returned by by GET request to `/animal/estimated_weight?date=insert_random_date_here`
      //    2. prove res has right status, data type

      var date = faker.date.recent();
      return chai.request(app)
        .get(`/animal/estimated_weight?date=${date}`)
        .then(function(res) {
          // so subsequent .then blocks can access resp obj.
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.be.a("number");
        });
    });
  });

  describe('POST animal endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that `id` is there (which means
    // the data was inserted into db)
    it('should add a new animal', function() {

      const newAnimal = {};

      return chai.request(app)
        .post('/animal')
        .send(newAnimal)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            '_id');
          // cause Mongo should have created id on insertion
          res.body._id.should.not.be.null;
        });
    });
  });

  describe('POST weight endpoint', function() {

    // strategy:
    //  1. Get an existing animal from db
    //  2. Make a POST request to add a new weight measurement to that animal
    //  3. Prove animal returned by request contains data we sent
    //  4. Prove animal weights in db has new entry
    it('should update weights array', function() {
      const updateData = {weight: faker.finance.amount(100,400,1), weigh_date: faker.date.recent()};
      var animalId;
      var arrayLength;
      return Animal
        .findOne()
        .then(function(animal) {
          animalId=animal.id;
          arrayLength = animal.weights.length;
          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .post(`/animal/${animal.id}/weight`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(201);

          return Animal.findById(animalId);
        })
        .then(function(animal) {
          animal.weights.length.should.equal(arrayLength+1);
        });
      });
  });
});

