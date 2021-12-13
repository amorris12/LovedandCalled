var sheetID = "1za2j9ZKgC2t6CCDZTmXa2di0YTKZbYqOaJqLtmzC4eM"; // the ID from the Google URL
var sheetName = "FormResponses";
var parsedData = []; // this will be the sheet data called by parsedData[row_number][column_heading]
var myColumnIDs = []; // this will call the column from the parsed data
var numOfRows = 0; // this will be the number of rows excluding the headers
var approvedRows = 0;
var numOfCols = 0; // this will be the number of columns
var limitAmt = 1;
var myHeadings = [
  "Timestamp",
  "Name of person completing",
  "Email",
  "First name",
  "Date",
  "Power&nbspExperienced",
  "Share your story",
  "Approved"
];

loadGoogleSheet(sheetID);

function loadGoogleSheet (whatSheetID) {
  sheetID = whatSheetID;
  fetch("https://opensheet.vercel.app/" + whatSheetID + "/" + sheetName)
    .then((res) => res.text())
    .then((text) => {
      parsedData = JSON.parse(text);

    let newData = text.substring(3);
    let grabBeg = 0;
    const quotMarks = "\",\"";
    while (newData.indexOf("},{") > grabBeg) {
      let grabEnd = newData.indexOf(":", grabBeg) - 1;
      myColumnIDs.push(newData.slice(grabBeg, grabEnd));
      newData = newData.substring(grabEnd);
      grabBeg = newData.indexOf(quotMarks) + 3;
    }
      numOfCols = myColumnIDs.length;
      numOfRows = parsedData.length;
      approvedRows = countApprovedRows();

      fillMyTable("", "G", "");

    });
}

function fillMyTable (whatSearch, displayColumns, searchColumns, limitRows) {
  let c = 0;
  let r = 0;
  let x = 0;
  let theseColumns = "";
  let setMyHeadings = "";
  let setMyTable = "";
  let searchResults = performSearch(whatSearch, searchColumns);
  let changesMade = false;

  if (displayColumns == undefined || displayColumns == "") { // whole table
    theseColumns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    x = numOfCols;
  } else { // less than the whole table
    theseColumns = displayColumns.replace(/,/g, "");
    theseColumns = theseColumns.replace(/ /g, "");
    theseColumns = theseColumns.toUpperCase();
    x = theseColumns.length;
  }

  let HeadingsDone = "N", rowCount = 0, limited = false;
  for (r = 0; r < numOfRows; r++) {    
    if (searchResults[r] == "Y" && parsedData[r].Approved == "TRUE") {
      let myTimestamp = parsedData[r].Timestamp; 
      let trimEnd = myTimestamp.indexOf(" ");
      let myDate = myTimestamp.substr(0, trimEnd);
      changesMade = true;
      setMyTable += "<tr>";
      for (c = 0; c < x; c++) {
        let thisColumnNum = columnAlphaToNum(theseColumns.substr(c, 1));
        if (parsedData[r][myColumnIDs[thisColumnNum]] == null || parsedData[r][myColumnIDs[thisColumnNum]] == undefined) {
          parsedData[r][myColumnIDs[thisColumnNum]] = "";
        }
        if (HeadingsDone == "N") {
          setMyHeadings += "<th onclick='sortTable(" + c + ")' class='th" + 
            c + "''>" + myHeadings[thisColumnNum] + "</th>";
        }         
        //Date and Miracle type small and bolded above story
        setMyTable += "<td><small><b>" + dateYYYYmmDD(myDate) + " - " + parsedData[r][myColumnIDs[5]] + "</b></small><br>" 
        + parsedData[r][myColumnIDs[thisColumnNum]] + "</td>";

      }
      setMyTable += "</tr>";
      HeadingsDone = "Y";
      rowCount ++;
      if (parsedData[r].Feature != null) {
        document.getElementById("fDate" + parsedData[r].Feature).innerHTML = dateAsText(myDate);
        document.getElementById("fText" + parsedData[r].Feature).innerHTML = parsedData[r][myColumnIDs[6]];
        document.getElementById("fName" + parsedData[r].Feature).innerHTML = parsedData[r][myColumnIDs[3]];
      }
      if (rowCount == limitRows && limitRows < approvedRows) {
        limited = true;
        break;
      }
    }
  }

  document.getElementById("myTableHeadings").innerHTML = setMyHeadings; //display the table headings
  document.getElementById("myTable").innerHTML = setMyTable; // display the table

  // display that the search item was not found
  let noChange = ""; if (changesMade == false) {noChange = "No stories for that type of miracle submitted yet"};
  document.getElementById("searchNull").innerHTML = noChange;

  // display a clickable banner to load more if needed
  if (limited) {
    document.getElementById("needMoreRows").innerHTML = "Showing the last " + limitRows + ", Click to load more";
  } else {
    document.getElementById("needMoreRows").innerHTML = "";
  }
    sortTable(0);
    sortTable(0);
}

function countApprovedRows() {
  let r = 0; let thisCount = 0;
  for (r = 0; r < numOfRows; r ++) {if (parsedData[r].Approved == "TRUE") {thisCount ++;}}
  return thisCount;
}

function columnAlphaToNum (columnLetter) { // Column A=0, B=1, etc
  let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alpha.indexOf(columnLetter.toUpperCase());   
}

function performSearch (searchKey, whichColumns) {
  /*
  searchKey is the text to look for. It could be one word or several, seperated by spaces.
  whichColumns limits the columns to search. Can be in format "ABC" (not case sensitive) or "A B C" or "A,B,C"
  To search within a specific column for one word and a different column for another word enter the searchKey as
  A==this B==that 
  */
    let r, c, s, x = 0;
    let theseColumns = "";
    let resultInRow = [];
  for (r = 0; r < numOfRows; r++) {resultInRow.push("N");} //set the search result for each row to NO

    let andSearch = true; //default is to search for instances of all words enter in the search
    if (searchKey.toUpperCase().indexOf(" OR") >= 0) { // "or" was typed in the search we change andSearch to false
      andSearch = false;
      searchKey = searchKey.toUpperCase();
      searchKey = searchKey.replace(/ OR/g, "");
    }

    let multiSearch = searchKey.split(" "); // creates an array of search keys if more than one word was entered
    
  for (s = 0; s < multiSearch.length; s++) {// executes the search for each word entered

      if (whichColumns == undefined || whichColumns == "") {
        // search all columns (limit 26)
        theseColumns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        x = numOfCols;
      } else {
        // search only indicated columns 
        theseColumns = whichColumns.replace(/,/g, "");
        theseColumns = theseColumns.replace(/ /g, "");
        theseColumns = theseColumns.toUpperCase();
        x = theseColumns.length;
      }

    if (multiSearch[s].indexOf("==") >= 0) {
      // overide columns to search if "==" is in the search key
      theseColumns = multiSearch[s].substr(0,1); //grab the column letter from A==this
      multiSearch[s] = multiSearch[s].substring(3); //remove the "=="
    }

      for (r = 0; r < numOfRows; r++) { // index search through all rows          
        if (s == 0 || resultInRow[r] == "Y" || andSearch == false) { //index search for each key word
        for (c = 0; c < x; c++) { // index search for desired number columns            
          let thisColumnNum = columnAlphaToNum(theseColumns.substr(c, 1));
          if (parsedData[r][myColumnIDs[thisColumnNum]].toUpperCase().search(multiSearch[s].toUpperCase()) >= 0) {
            resultInRow[r] = "Y";
            break; // if the key word has been found we don't need to check the remaining columns
          } else {
            if (andSearch) {resultInRow[r] = "N";} // if the first key word was found but subsequent was not
          }
        }
        }
      }
  }     
  return resultInRow; // an array with either Y or N search result for each row
}

function waitForEnter () {
  if (event.keyCode === 13) {
    document.getElementById("newTableBtn").click();
  }   
}

function sortTable (n) {
  let table, rows, rowIsNumber, switching, i, a, b, shouldSwitch, dir, switchcount = 0;

  table = document.getElementById("myTable");
  switching = true;
  dir = "asc"; 
  rows = table.rows;

  rowIsNumber = true;
  for (i = 0; i < (rows.length - 1); i++) {
    // check if any of the values in the column are not numbers
    let thisValue = rows[i].getElementsByTagName("TD")[n].innerHTML.replace("$", "");
    // we take out one $ so that a column of currency will sort like a number
    if (isNaN(Number(thisValue))) { 
      rowIsNumber = false;
      break;
    }
  }

  while (switching) { // loop until no switches are made
    switching = false;

    // loop through the rows except the last, because two are checked at once
    for (i = 0; i < (rows.length - 1); i++) { 
      shouldSwitch = false;

      // finds elements to compare and sets them as strings or numbers
      if (rowIsNumber == false) {
        a = rows[i].getElementsByTagName("TD")[n].innerHTML.toUpperCase();
        b = rows[i + 1].getElementsByTagName("TD")[n].innerHTML.toUpperCase();
      } else {
        a = Number(rows[i].getElementsByTagName("TD")[n].innerHTML.replace("$", ""));
        b = Number(rows[i + 1].getElementsByTagName("TD")[n].innerHTML.replace("$", ""));
      }
      // compares a & b to see if they need to be switched in the order
      if (dir == "asc") {
        if (a > b) {
          shouldSwitch = true;
          break;
        }
        } else if (dir == "desc") {
        if (a < b) {
          shouldSwitch = true;
          break;
        }
      }
    }
    // switch the two elements
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount ++;      
    } else {
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}

function loadMore () {
  table = document.getElementById("myTable");
  rows = table.rows;
  fillMyTable("", "G", "", rows.length + limitAmt);
}

function dateAsText(dateAsNumbers) { // dd-mm-yyyy
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", 
    "September", "October", "November", "December"];

  let myMonth = Number(dateAsNumbers.slice(0, dateAsNumbers.indexOf("/"))) - 1;
  dateAsNumbers = dateAsNumbers.substr(dateAsNumbers.indexOf("/") + 1);
  let myDay = dateAsNumbers.slice(0, dateAsNumbers.indexOf("/"));
  dateAsNumbers = dateAsNumbers.substr(dateAsNumbers.indexOf("/") + 1);
  let myYear = dateAsNumbers;
  
  let thisDate = new Date(myYear, myMonth, myDay);
  let dayOfWeek = thisDate.getDay();

  return days[dayOfWeek] + ", " + months[myMonth] + " " + Number(myDay) + ", " + myYear;
}

function dateYYYYmmDD(dateDDmmYYY) {
  let splitDate = dateDDmmYYY.split("/");
  if (splitDate[0].length != 2) {splitDate[0] = "0" + splitDate[0];}
  if (splitDate[1].length != 2) {splitDate[1] = "0" + splitDate[1];}
  return splitDate[2] + "/" + splitDate[0] + "/" + splitDate[1];
}

function openTab(n) {
  let i, tabcontent, topTabs;
  tabcontent = document.getElementsByClassName("tabContent");
  topTabs = document.getElementsByClassName("topTab");
  for (i = 0; i < tabcontent.length; i ++) {
    tabcontent[i].style.display = "none";
    topTabs[i].style.backgroundColor = "";
    topTabs[i].style.color = "";
  }
  tabcontent[n].style.display = "block";
  topTabs[n].style.backgroundColor = "#D6D5D0";
  topTabs[n].style.color = "black";
}

function openMobileMenu() {
  var x = document.getElementById("menuItems");
  var y = document.getElementById("topNav");
  if (x.className === "navItems") {    
    x.className += " mobile";
    y.className = "mobile";
  } else {
    x.className = "navItems";
    y.className = "";
  }
}

function openModal(modalID) {
  document.getElementById(modalID).style.display='block';  
  if (window.innerWidth < 601) {document.getElementById("bars").click();}
}

function loadMenu() {
  let menuData = [];
  fetch("https://opensheet.vercel.app/1za2j9ZKgC2t6CCDZTmXa2di0YTKZbYqOaJqLtmzC4eM/Menu")
    .then((res) => res.text())
    .then((text) => {
      menuData = JSON.parse(text);
      document.getElementById("topNav").innerHTML = menuData[0].html;

    });
}