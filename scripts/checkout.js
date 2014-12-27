var SantaRosa = [38.438710, -122.716763,"Santa Rosa"];
var coords = [];
var map = null;
var db = null;
var verify = false;
var maxTableSize=50;

$(document).ready(function () {
    $("#dbfile").change(loadDatabase);
    $("#tertable").click(refreshMap);
	$("#mapResize").resizable();

    var currentDate = new Date();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    $("#outDate").val(month + "/" + day + "/" + year);

    $("#checkout").hide();
    $("#checkoutButton").click(checkoutTerritory);
});

// Load database from a user selected file
function loadDatabase()
{
    var f =  $('#dbfile').prop('files')[0];
    var r = new FileReader();
    r.onload = function(){readDbFile(r)};
    r.readAsArrayBuffer(f);
    
    $("#fileSelect").hide();
    $("#checkout").show();
}

// Read the database file
function readDbFile(fileReader)
{
    var Uints = new Uint8Array(fileReader.result);
    db = new SQL.Database(Uints);
        
    // Clear existing menu
    document.getElementById("termenu").innerHTML = "";
    
    // Read out territory names
    var res = db.exec("SELECT tername FROM territory");
    res[0].values.forEach(function(rowData) {
        fillDropDownMenu(rowData);
    });
    $(".chosen-select").chosen();
    
    $("#termenu").change(createTerritoryTable);
}

function fillDropDownMenu(rowData)
{
    var menu = document.getElementById("termenu");
    var terOption = document.createElement('option');
    terOption.value = rowData[0];
    terOption.innerHTML = rowData[0];
    menu.appendChild(terOption);
}

function createTerritoryTable()
{
    // Clear current table and map
    document.getElementById("tertable").innerHTML = "";
    coords = [];
    
    // Read out selected territory
    var menu = document.getElementById("termenu");
    var tername = menu.options[menu.selectedIndex].value;
    var res = db.exec("SELECT * FROM master WHERE tername = \"" + tername + "\";");
    
    writeTableHeaderRow();
    
    var index = 1;
    for (var i = 0; i < res[0].values.length && i < maxTableSize; i++)
    {
        var rowData = res[0].values[i];
        index = writeTableRow(rowData, index);
    }
    
    generateMap();
}

function writeTableHeaderRow()
{
    var table = document.getElementById("tertable");
    var tableBody = document.createElement('thead');
    var row = document.createElement('tr');
    
    // Create columns
    var cell = document.createElement('td');
    cell.colSpan = "3";
    cell.className = "nh-head";
    cell.innerHTML = "NH";
    row.appendChild(cell);
    
    var cell = document.createElement('td');
    cell.className = "index-head";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "name";
    cell.innerHTML = "Name";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "addr";
    cell.innerHTML = "Address";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "conf";
    cell.innerHTML = "Confirmed";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "notes";
    cell.innerHTML = "Notes";
    row.appendChild(cell);
    
    tableBody.appendChild(row);
    table.appendChild(tableBody);
}

function writeTableRow(rowData, index)
{
    var verify = $("#verifySel").val() == "show"
    // Skip if marked as not chinese
    if (!verify && (rowData[9] == 1 || rowData[14] == "Not CH"))
    {
        return index;
    }
    
    var table = document.getElementById("tertable");
    var row = document.createElement('tr');
    
    // Fill cell data
    // NH boxes
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    row.appendChild(document.createElement('td'));
    
    // Index
    var cell = document.createElement('td');
    cell.className = "index";
    cell.innerHTML = index;
    row.appendChild(cell);
    
    // Name
    cell = document.createElement('td');
    cell.className = "name";
    cell.innerHTML = rowData[0];
    row.appendChild(cell);
    
    // Address
    cell = document.createElement('td');
    cell.className = "addr";
    cell.innerHTML = rowData[1] + " " + rowData[2];
    row.appendChild(cell);
    
    // Confirmed
    cell = document.createElement('td');
    cell.className = "conf";
    if ( rowData[14] == 1 || rowData[14] == "Yes")
    {
        cell.innerHTML = "Yes";
    }
    else if ( rowData[9] == 1)
    {
        cell.innerHTML = "Not CH";
    }
    row.appendChild(cell);
    
    // Notes
    cell = document.createElement('td');
    cell.className = "notes";
    if (rowData[7] != null)
    {
        cell.innerHTML = rowData[7];
    }
    row.appendChild(cell);
    
    
    table.appendChild(row);
    
    // Fill coordinate info;
    if (rowData[12] != null &&
        rowData[13] != null)
    {
        coords[index-1] = [rowData[12],rowData[13]];
    }
    
    return index + 1;
}

function generateMap()
{
    if (map == null)
    {
        createMap();
    }
    refreshMap();
}

function checkoutTerritory()
{
    // Mark selected territory as checked out
    var menu = document.getElementById("termenu");
    var tername = menu.options[menu.selectedIndex].value;
    var command = "UPDATE territory SET free=\"FALSE\" WHERE tername=\"" + tername + "\";";
    var res = db.exec(command);

    // Mark check out date from text box
    var date = $("#outDate").val();
    command = "UPDATE territory SET outdate = \"" + date + "\" WHERE tername=\"" + tername + "\";";
    var res = db.exec(command);

    // Read out selected territory
    var data = db.export();
    var blob = new Blob([data], {type: "application/x-sqlite3;charset=" + document.characterSet});
    saveAs(blob, "territory.db");
    console.log("File save done");
}