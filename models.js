const mongoose = require('mongoose');

const animalSchema = mongoose.Schema({
  weights: [{weight: Number, weigh_date: Date}]
});


animalSchema.methods.estimatedWeight= function(date) {
  var beforeDate = "0001-01-01T12:00:00Z";
  var afterDate = "9999-01-01T12:00:00Z";
  var beforeWeight = this.weights[0].weight;
  var afterWeight = this.weights[0].weight;
  for (var i = 0; i<this.weights.length; i++){
    if (this.weights[i].weigh_date==date){
      return this.weights[i].weight;
    }
    else if (this.weights[i].weigh_date<date&&this.weights[i].weigh_date>beforeDate){
      beforeDate = this.weights[i].weigh_date;
      beforeWeight = this.weights[i].weight;
    }
    else if (this.weights[i].weigh_date>date&&this.weights[i].weigh_date<afterDate){
      afterDate = this.weights[i].weigh_date;
      afterWeight = this.weights[i].weight();
    }
  }
  return (beforeWeight+afterWeight)/2;
};


const Animal = mongoose.model('Animal', animalSchema);

module.exports = {Animal};
