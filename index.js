"use strict";
// Imports
const express = require('express') //module used to get the express application
const port = 8000 //port which localhost will listen on
const bodyParser = require('body-parser'); //parse body of requests
const urlEncodedBodyParser = bodyParser.urlencoded({ extended: false }); //parse encoded bodies of requests
const fs = require('fs'); //file system used to read and write from json file
const app = express(); //puts new Express application inside the app variable

// Static Files
app.use(express.static('public')) //make the app public
app.use(express.json()) // use json data
app.use('/css', express.static(__dirname + '/css')) //use for css files
app.use('/js', express.static(__dirname + '/js')) //use for js files

//when url is only localhost:8000 redirect to index.html
app.get('', (req, res) => {
  res.sendFile(__dirname + '/index.html') //redirect to index.html page
})

const server = app.listen(port, () => console.info(`Listening on port ${port}`)) // Listen on port 8000

/**
 * enters when bundle.js calls fetch with /index to add new transaction.
 * this function adds a new transaction to the json file using the data found in the body of the request
*/
app.post('/index', urlEncodedBodyParser, (req, res) => {
  console.log('i got an addition request');

  //first we get the content inside the json file
  fs.readFile('./js/teest.json', function readFileCallback(err, data) {
    if (err) {
      console.log(err); // display error message
    } else {
      var obj = JSON.parse(data); //now the data we got is an object
      obj.unshift(req.body); //add some new data from the request body to the existing one
      fs.writeFileSync('./js/teest.json', JSON.stringify(obj, null, 2)); //write new object with the added data to the json file
      console.log("transaction added");
      res.json({
        saved: JSON.stringify(obj, null, 2) //send to bundle.js the new data
      }); //send json inside response
    }
  });
})

/**
 * enters when bundle.js calls fetch with /delete to delete a transaction.
 * this function deletes a transaction from the json file using the id of the json object we get from the req object
*/
app.post('/delete', urlEncodedBodyParser, (req, res) => {
  console.log('i got a delete request');

  //first we get the content inside the json file
  fs.readFile('./js/teest.json', function readFileCallback(err, data) {
    if (err) {
      console.log(err); // display error message
    } else {
      var obj = JSON.parse(data); //now the data we got is an object

      //iterate through the json array to find object with the requested id
      obj.forEach(function (result, index) {
        if (result["id"] === req.body.id) {
          obj.splice(index, 1); //delete the object from the index matched with a range of 1 meaning the object itself
        }
      });

      //write updated data to the json file
      fs.writeFileSync('./js/teest.json', JSON.stringify(obj, null, 2));
      console.log("transaction deleted");
      res.json({
        saved: JSON.stringify(obj, null, 2) //send to bundle.js the new data
      }); //send json inside response
    }
  });
})

/**
 * enters when bundle.js calls fetch with /filter to filter the data with date parameters.
 * this function filters the json data file with from and to date and returns all data in that range
*/
app.post('/filter', urlEncodedBodyParser, (req, res) => {

  //first we get the content inside the json file
  fs.readFile('./js/teest.json', function readFileCallback(err, data) {
    if (err) {
      console.log(err); // display error message
    } else {
      var startDate = new Date(req.body.FrDdate); //get from data from the request body and create a date variable
      var endDate = new Date(req.body.ToDate); //get to data from the request body and create a date variable

      //filter through each object in the json array
      var resultProductData = JSON.parse(data).filter(function (entry) {
        var dayJSON = new Date(entry.date); //create a date from the json object
        return dayJSON >= startDate && dayJSON <= endDate; //add the object if its date fall in the range
      });
      console.log("data filtered");
      res.json({
        saved: JSON.stringify(resultProductData, null, 2) //send to bundle.js the filtered data
      }); //send json inside response
    }
  });
});

/**
 * enters when bundle.js calls fetch with /exit close the program and delete the data.
*/
app.get('/exit', (req, res) => {
  console.log("exit");
  fs.writeFileSync('./js/teest.json', '[]'); //delete all the data from the json file
  res.send("success"); //return success to bundle.js
  server.close(() => {
    console.log('Closed out remaining connections');
  }); //close the connection to port 8000
});

/**
 * enters when bundle.js calls fetch with /exitWO close the program without deleting the data.
*/
app.get('/exitWO', (req, res) => {
  console.log("exitwo");
  res.send("success"); //return success to bundle.js
  server.close(() => {
    console.log('Closed out remaining connections');
  }); //close the connection to port 8000
})
