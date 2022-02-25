"use strict";

/**
 * The JSON file is composed of the follwing data elements:
 * ID: unique ID for each entry
 * title: the description of the transaction made from the user
 * amount: the amount recorded in the transaction from the user
 * date: the data the transaction was recorded from the user
 * tmstmp : a timestamp noting the exact time the transaction was saved in the file
 * imgs: the image of the trash can displayed in the table
 */


/**
 * This class contains all the functions and logic which makes features in this project work like:
 * Adding a new transaction.
 * Deleting a transaction.
 * Filtering data by X amount.
 * Filtering data by a date range.
 * @class TransactionBuilder
 */

class TransactionBuilder {

  //default constructor when a new instance of the class is created
  constructor() {
    this.IncomeAmount = document.getElementById("income-amount"); //manipulate income element in the interface stats panel
    this.expenseAmount = document.getElementById("expense-amount"); //manipulate expense element in the interface stats panel
    this.balance = document.getElementById("balance"); //manipulate balance element in the interface stats panel
    this.balanceAmount = document.getElementById("balance-amount"); //manipulate balance element in the interface stats panel
    this.tranFeedback = document.getElementById("transaction-popup"); //manipulate transaction popup element in the interface
    this.tranForm = document.getElementById("transaction-form"); //manipulate transaction form in the interface
    this.tranDesc = document.getElementById("description-input"); //manipulate transaction description field element in the interface
    this.tranAmount = document.getElementById("amount-input"); //manipulate transaction amount field element in the interface
    this.tranDate = document.getElementById("date-input"); //manipulate transaction date field element in the interface
    this.queryForm = document.getElementById("query-form"); //manipulate query form in the interface
    this.DFrom = document.getElementById("date-from"); //manipulate query from date field element in the interface
    this.DTo = document.getElementById("date-to"); //manipulate query to date field element in the interface
    this.QAmount = document.getElementById("query-amount"); //manipulate query amount field element in the interface
    this.QFeedback = document.getElementById("query-popup"); //manipulate query popup element in the interface

    this.itemList = []; //store all expense entries 
    this.itemList1 = []; //store all income entries
    this.itemID = 0; //id of the next inserted transaction
    this.showCount = 10 //count of entries in the table
    this.backData = ""; //json data i get from index.js
  }

  /**
 * Deletes a transaction from the table.
 * This function takes the ID of the row which is at the same time the ID of the entry in the JSON file 
 * and sends it to index.js using fetch /delete where the entry is deleted from the JSON file,
 * then all the data is retrieved where the updated table is redrawn
 * @param  {Number} itemID ID of the table entry
 * @memberof TransactionBuilder class which this function falls under
 */
  async deleteTransaction(itemID) {
    let obj = {
      id: itemID, //store the id of the row to be deleted
    }

    const options = {
      method: 'POST', // Contains the request's method
      mode: 'cors', // lead to valid responses, and which properties of the response are readable.
      cache: 'default', //it controls how the request will interact with the browser's HTTP cache.
      headers: {
        'Content-Type': 'application/json' //content is a json object
      },
      body: JSON.stringify(obj) //body of the request containing the json object
    };

    var table = $('#example').DataTable(); //initialize the table variable
    table.row('#example tr[id=tr_' + itemID + ']').remove().draw(true); //remove row with the chosen id from table
    var response = await fetch('/delete', options); //call index.js to delete json object with corresponding id
    var jsonString = await response.json(); //transform call response to json from string
    var json = JSON.parse(jsonString.saved); // get nested json data from the saved option in the 1st json object
    this.backData = json; //save json data in class member variable

    this.itemList.splice(0, this.itemList.length); //delete expense array
    this.itemList1.splice(0, this.itemList1.length); //delete income array
    this.itemList.length = 0; //delete expense array
    this.itemList1.length = 0; //delete income array

    //clear table and insert back the latest 10 transactions made
    table.clear().rows.add(this.backData.sort(function (a, b) { return a.tmstmp < b.tmstmp ? 1 : -1; }).slice(0, this.showCount)).draw();
    var self = this; //this inside foreach doesnt work, so i put this in a variable

    //iterate through each item in json array
    json.forEach(function (result, index) {
      if (result["amount"] < 0) {
        self.itemList.push(result); //insert json object in expense array
      }
      else {
        self.itemList1.push(result); //insert json object in expense array
      }
    });
    this.showBalance(); //update stats panel balance

  }

 
  /**
   * Refreshes the Stats Panel on transaction insert/delete.
   * Calls two function which calculate total expense and income respectively from the Datatable
   * and then calculate the total between the two previously variables to get the balance.
   * @memberof TransactionBuilder class which this function falls under
   */
  showBalance() {
    var expense = this.totalExpense(); //get total expense
    var income = this.totalIncome(); // get total income
    var total = income + expense; //calculate balance
    //balance negative
    if (total < 0) {
      this.balanceAmount.textContent = "(" + Math.abs(total) + ")"; // get absolute value of the balance and display it as (balance) in stats panel
      this.balance.classList.remove('showGreen', 'showBlack'); //remove other colors in case of previous total was greater or equal than 0
      this.balance.classList.add('showRed'); //give balance a red color
      //balance positive
    } else if (total > 0) {
      this.balanceAmount.textContent = total; //display balance in stats panel
      this.balance.classList.remove('showRed', 'showBlack'); //remove other colors in case of previous total was smaller or equal than 0
      this.balance.classList.add('showGreen'); // give balance a green color
      //balance equal to 0
    } else if (total === 0) {
      this.balanceAmount.textContent = total; //display balance in stats panel
      this.balance.classList.remove('showRed', 'showGreen'); //remove other colors in case of previous total was greater or smaller than 0
      this.balance.classList.add('showBlack'); // give balance a black color
    }
  }

  /**
   * Retrieves Data based on the parameters users enter in the Query Form
   * This function gets the inputs in the first three lines then checks if they are up to the requirements,
   * If the numerical option is chosen then the last X entries entered will be shown. In contrast, if a date range is chosen,
   * all entries which have their transaction date in the date range will be returned from the /filter fetch call and wil be used
   * to draw the updated table.
   * @memberof TransactionBuilder class which this function falls under
   */
  async queryData() {
    var QueDateFrom = this.DFrom.value; //variable containing query from date
    var QueDateTo = this.DTo.value; //variable containing query to date
    var QueAmount = this.QAmount.value; //variable containing query x amount of entries to be shown

    //if form submitted is empty
    if (QueDateFrom === '' && QueDateTo === '' && (QueAmount === '' || QueAmount < 0)) { 
      this.QFeedback.classList.add('showItem'); //change display to be shown
      this.QFeedback.classList.add('alert-danger'); //gives alert red color
      this.QFeedback.innerHTML = `<p>Please choose either a date range or a positive amount of rows to display</p>`; //text inside alert
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.QFeedback.classList.remove('showItem'); //hide alert
        self.QFeedback.classList.remove('alert-danger'); //remove alert red color
      }, 3000) //set a timout where after the time allocated the code inside will work
    }
    //if only 1 date is entered
    else if ( (QueDateFrom === '' && QueDateTo != '') || (QueDateFrom != '' && QueDateTo === '') && (QueAmount === '' || QueAmount < 0)) {
      this.QFeedback.classList.add('showItem'); //change display to be shown
      this.QFeedback.classList.add('alert-danger'); //gives alert red color
      this.QFeedback.innerHTML = `<p>Please enter both start and end date</p>`;
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.QFeedback.classList.remove('showItem'); //hide alert
        self.QFeedback.classList.remove('alert-danger'); //remove alert red color
      }, 3000) //set a timout where after the time allocated the code inside will work
    }
    //if to date is bigger than from date
    else if ( QueDateFrom > QueDateTo  && (QueAmount === '' || QueAmount < 0)) {
      this.QFeedback.classList.add('showItem'); //change display to be shown
      this.QFeedback.classList.add('alert-danger'); //gives alert red color
      this.QFeedback.innerHTML = `<p>To Date cannot be before From Date </p>`;
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.QFeedback.classList.remove('showItem'); //hide alert
        self.QFeedback.classList.remove('alert-danger'); //remove alert red color
      }, 3000) //set a timout where after the time allocated the code inside will work
    }
    //if both filter options are entered
    else if (QueDateFrom != '' && QueDateTo != '' && QueAmount != '') {
      this.QFeedback.classList.add('showItem'); //change display to be shown
      this.QFeedback.classList.add('alert-danger'); //gives alert red color
      this.QFeedback.innerHTML = `<p>Please choose one of the options not both</p>`;
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.QFeedback.classList.remove('showItem'); //hide alert
        self.QFeedback.classList.remove('alert-danger'); //remove alert red color
      }, 3000) //set a timout where after the time allocated the code inside will work
    }
    else {
      if (QueAmount != '') { //if query is by last x amount of entries
        this.showCount = QueAmount; //set count of entries in table
        var table = $('#example').DataTable(); //initialize the table variable
        //sort data by timestamp and show last x entries entered
        table.clear().rows.add(this.backData.sort(function (a, b) { return a.tmstmp < b.tmstmp ? 1 : -1; }).slice(0, this.showCount)).draw();
      }
      else {

        var dateRange = {
          FrDdate: QueDateFrom, //from date
          ToDate: QueDateTo //to date
        } // set date range to a variable

        const options = {
          method: 'POST', // Contains the request's method
          mode: 'cors', // lead to valid responses, and which properties of the response are readable.
          cache: 'default', //it controls how the request will interact with the browser's HTTP cache.
          headers: {
            'Content-Type': 'application/json' //content is a json object
          },
          body: JSON.stringify(dateRange) //body of the request containing the date range object
        };

        var table = $('#example').DataTable(); //initialize the table variable
        var response = await fetch('/filter', options); //call index.js to get filtered data
        var jsonString = await response.json(); //transform call response to json from string
        var json = JSON.parse(jsonString.saved); // get nested json data from the saved option in the 1st json object
        this.backData = json; // save filtered data in class member function
        table.clear().rows.add(this.backData).draw(); //display filtered data in table
      }
      this.queryForm.reset(); //empty query form on interface
    }
  }

 
  /**
   * Submits a transaction entered by the user
   * This function gets the inputs in the first three lines then checks if they are up to the requirements.
   * After the check, these inputs are stored in an object alongside a timestamp input of the current date,
   * an auto generated ID, and the delete IMG which will be sent to function addEntry and the balance will be refreshed.
   * @memberof TransactionBuilder class which this function falls under
   */
  submitTransactionForm() {
    var descValue = this.tranDesc.value; //variable containing transaction description
    var dateValue = this.tranDate.value; //variable containing transaction date
    var amountValue = this.tranAmount.value; //variable containing transaction amount
    
    //if any entered field is empty show alert popup
    if (descValue === '' || amountValue === '' || dateValue === '') {
      this.tranFeedback.classList.add('showItem'); //change display to be shown
      this.tranFeedback.classList.add('alert-danger'); //gives alert red color
      this.tranFeedback.innerHTML = `<p>Please enter all values</p>`; //text inside alert
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.tranFeedback.classList.remove('showItem'); //hide popup
        self.tranFeedback.classList.remove('alert-danger'); //removes red color
      }, 3000) //set a timout where after the time allocated the code inside will work
    } else {
      let amount = parseInt(amountValue); //turn value into number from string
      this.tranForm.reset(); //empty transaction form on interface
      var curdate = new Date(); //get current date for timestamp variable
      var tranobj = {
        id: this.itemID,
        title: descValue,
        amount: amount,
        date: dateValue,
        tmstmp: curdate,
        imgs: "<a href='#'  class='delete-icon' data-id='" + this.itemID + "'> <i class='fas fa-trash' style='color:var(--mainBlue);'></i>  </a>"
      } //object containing all info about the new transaction

      this.itemID++; //increment the id for the next transaction
      if (amount < 0)
        this.itemList.push(tranobj); //add transaction object to expense array
      else
        this.itemList1.push(tranobj); //add transaction object to income array

      this.addEntry(tranobj); //call function to add transaction in json file
      this.showBalance(); //update stats panel
      this.tranFeedback.classList.add('showItem'); //show alert
      this.tranFeedback.classList.add('alert-success'); //give it a green color 
      this.tranFeedback.innerHTML = `<p>Transaction Inserted Successfully</p>`; // text inside alert
      var self = this; //this inside timout doesnt work, so i put this in a variable
      setTimeout(function () {
        self.tranFeedback.classList.remove('showItem');
        self.tranFeedback.classList.remove('alert-success');
      }, 3000) //set a timout where after the time allocated the code inside will work
    }
  }


  /**
   * Connects with index.js to add transaction inserted to the JSON file.
   * This function uses fetch to call index.js and send the object containing the data the user inserted
   * and adds the entry to the table where it will be displayed.
   * @param {Object} obj Object which contains user inserted data
   * @memberof TransactionBuilder class which this function falls under
   */
  async addEntry(obj) {
    const options = {
      method: 'POST', // Contains the request's method
      mode: 'cors', // lead to valid responses, and which properties of the response are readable.
      cache: 'default', //it controls how the request will interact with the browser's HTTP cache.
      headers: {
        'Content-Type': 'application/json' //content is a json object
      },
      body: JSON.stringify(obj) //body of the request containing the json object
    };

    var table = $('#example').DataTable(); // define the table variable
    table.row.add({
      "title": obj.title,
      "amount": obj.amount,
      "date": obj.date,
      "imgs": obj.imgs,
      "tmstmp": obj.tmstmp
    }).node().id = 'tr_' + obj.id; //add a new row to table containing the user entered elements and assign it the row the incremented id
    table.draw(); //refresh the table

    var response = await fetch('/index', options); //call index.js to save json in the file
    var jsonString = await response.json(); //response from the fetch call containing all the data
    var json = JSON.parse(jsonString.saved); //transform response from String to json
    this.backData = json; //save json data in class member variable
    this.showCount = 10; //max for amount to show in table
    //sort data by timestamp and show last 10 entries entered
    table.clear().rows.add(this.backData.sort(function (a, b) { return a.tmstmp < b.tmstmp ? 1 : -1; }).slice(0, this.showCount)).draw();

  }

  
  /**
   * Calculates total expense.
   * Iterates through the itemList which contains all expenses entries and adds up their total
   * which is displayed the stats panel
   * @return {Number}  The total of all expense entries
   * @memberof TransactionBuilder class which this function falls under
   */
  totalExpense() {
    let total = 0; //total expense at the start
    if (this.itemList.length > 0) {
      //returns accumulated result of all expense transactions, start from 0
      //acc is accumulated total   curr is the amount of the current index
      total = this.itemList.reduce(function (acc, curr) {
        acc += curr.amount; //adds current of top of the previous total
        return acc; //returns new total
      }, 0)
    }
    this.expenseAmount.textContent = "(" + Math.abs(total) + ")"; // displays total expense in the stats panel
    return total; //return total expense amount
  }

  /**
   * Calculates total income.
   * Iterates through the itemList1 which contains all income entries and adds up their total
   * which is displayed the stats panel
   * @return {Number}  The total of all incmome entries
   * @memberof TransactionBuilder class which this function falls under
   */
  totalIncome() {
    let total = 0; //total income at the start
    if (this.itemList1.length > 0) {
      //returns accumulated result of all income transactions, start from 0
      //acc is accumulated total   curr is the amount of the current index
      total = this.itemList1.reduce(function (acc, curr) {
        acc += curr.amount; //adds current of top of the previous total
        return acc; //returns new total
      }, 0)
    }
    this.IncomeAmount.textContent = total; // displays total income in the stats panel
    return total; //return total income amount
  }

}

// This function is called when the page is loaded
$(document).ready(function () {
  var tb = new TransactionBuilder();   //new instance of TransactionBuilder Class
 
  // initialize the popup clicked when exiting the program 
  $("#dialog").dialog({
    modal: "true", // disables other items on the page
    autoOpen: false, // does not open automatically on page load
    title: "Close Options", // popup title
    width: "600", // popup width
    height: "230" // popup height
  });

  //event listener when exit icon is clicked
  $("#exitProgram").click(function () {
    $("#dialog").dialog("open"); // opens popup to choose close option 
  });

  $("#closeWith").click(function () {
    const options = {
      method: 'GET', // Contains the request's method
      mode: 'cors', // lead to valid responses, and which properties of the response are readable.
      cache: 'default', //it controls how the request will interact with the browser's HTTP cache.
    };
    const closeW = fetch('/exit', options).then(response => window.close()); //on call success, close the window
  });

  $("#closeWithout").click(function () {
    const options = {
      method: 'GET', // Contains the request's method
      mode: 'cors', // lead to valid responses, and which properties of the response are readable.
      cache: 'default', //it controls how the request will interact with the browser's HTTP cache.
    };
    const closeWO = fetch('/exitWO', options).then(response => window.close()); //on call success, close the window
  });

  //fetches the data from the JSON file
  fetch('./js/teest.json')
    .then(response => response.json()) //transforms the retrieved data from String to JSON
    .then(data => {
      tb.backData = data; // stores the JSON data in the class variable

      var decoy = data.sort(function (a, b) { return a.id < b.id ? 1 : -1; }); //sorts data based on id

      //this is used to give new transactions incremental unique ids and not confuse two transactions with the same id
      if (decoy != null && decoy != "")
        tb.itemID = decoy[0].id + 1; // increments from the biggest id retrieved from the sort
      else
        tb.itemID = 0; // if no data is retrieved the next inserted transaction will carry the id 0

        //initialize the table where data is displayed
      var table = $('#example').DataTable({
        scrollY: 430, //table height
        scrollX: true, //table width
        scrollCollapse: true, //force the height of the table's viewport to the given height
        "initComplete": function (settings, json) { // when table is fully loaded
          table = settings.oInstance.api(); // creates table variable
          //event listener when trash can img in a row is clicked
          $('#example tbody').on('click', 'tr td.rowBtn', function () {
            var data = table.row(this).data(); //gets the data from the clicked row
            tb.deleteTransaction(data.id); // calls the delete function to remove the row from the table
          });
          
          //runs through every row in the table
          table.rows().every(function () {
            var Row = this.data();
            if (Row.amount < 0) {
              tb.itemList.push(Row); //amonut negative = expense is added to the class member variable which carries all expense values
            }
            else {
              tb.itemList1.push(Row); //amonut positive = income is added to the class member variable which carries all income values
            }
          });
          tb.showBalance(); // refreshes the stats panel to update the balance
          $($.fn.dataTable.tables(true)).DataTable().columns.adjust(); //adjusts column size
        },
        "data": data.sort(function (a, b) { return a.tmstmp < b.tmstmp ? 1 : -1; }).slice(0, tb.showCount), //shows last X entries entered in the table
        "createdRow": function (row, data, dataIndex) { //adds elements to every row in the table
          if (data.amount < 0) {
            $(row).addClass('expenseClass'); //gives the red color for written expense elements in the row
          }
          else {
            $(row).addClass('incomeClass'); //gives the green color for written income elements in the row
          }
        },
        "bLengthChange": false, // does not show dropdown for size of table data shown

        // places data retrieved in table columns
        "columns": [
          { "data": "title" }, // description of transaction
          { "data": "amount" }, // amount of transaction
          { "data": "date" }, // date of transaction
          { "data": "imgs" }, // trash can icon
          { "data": "tmstmp" }, // when the transaction was entered
        ],

        //assigns element id to each table row
        rowId: function (a) {
          return 'tr_' + a.id;
        },
        //customize each column in the table 
        columnDefs: [
          { "targets": 0, "className": "rowDesc", "width": "35%" }, //give first column 35% width and class rowDesc
          { "targets": 1, "className": "rowAmount", "width": "8%", "createdCell": function (td, cellData, rowData, row, col) {
              if (cellData < 0) {$(td).text('(' + cellData.toString().substring(1) + ')') }
            } //give second column 8% width and class rowAmount, each cell in second column with negative amount change it to (positive number)
          }, 
          { "targets": 2, "className": "rowData", "width": "15%" }, //give third column 15% width and class rowData
          { "targets": 3, "className": "rowBtn", "width": "8%" }, //give fourth column 8% width and class rowBtn
          {"targets": 4,  "visible": false  }, //make the timestamp column invisible
        ],
        "order": [4, 'desc'] //sets default order of the table which is by timestamp
      });

    });
  var tranForm = document.getElementById('transaction-form'); //create variable for the new transaction form
  var querForm = document.getElementById('query-form'); //create variable for the data querys form

  //add listener when a new transaction is submited
  tranForm.addEventListener('submit', function (event) {
    event.preventDefault(); ///if the event is not handled, its default action should not be taken as it normally would be
    tb.submitTransactionForm(); //calls function to add transaction to JSON file
  });

   //add listener when a data query is submited
  querForm.addEventListener('submit', function (event) {
    event.preventDefault(); //if the event is not handled, its default action should not be taken as it normally would be
    tb.queryData(); //calls function to query data
  });

});