const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const {DATABASE_URL, PORT} = require('./config');
const {Animal} = require('./models');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;


app.get('/animal', (req, res) => {
  Animal
    .find()
    .then(animals => {
      res.json(animals);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});
app.get('/animal/estimated_weight', (req, res) => {
  var sum = 0;
  var num = 0;
  Animal
    .find()
    .then(animals => {
      animals.forEach(animal=> {
        sum +=animal.estimatedWeight(req.params.date);
        num +=1;
      });
      res.json(sum);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went terribly wrong'});
    });
});


app.post('/animal', (req, res) => {

 Animal
    .create({})
    .then(animal => {
      res.status(201).json(animal);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });

});
app.post('/animal/:id/weight', (req, res) => {

 Animal
    .findById(req.params.id)
    .then(animal => {
      animal.weights.push(req.body);
      Animal.findByIdAndUpdate(animal._id, {$set: {weights: animal.weights}})
      .then(animal =>{
        res.status(201).json(animal);
      });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });

});



app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
