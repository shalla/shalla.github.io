var SantaRosa = [38.438710, -122.716763,"Santa Rosa"];
var coords = [];
var map = null;
var db = null;
var dbAddresses=[];
var maxTableSize=50;

$(document).ready(function () {
    $("#dbfile").change(loadDatabase);
    $("#tertable").click(refreshMap);
	$("#mapResize").resizable();

    var currentDate = new Date();
    var day = currentDate.getDate();
    var month = currentDate.getMonth() + 1;
    var year = currentDate.getFullYear();
    $("#inDate").val(month + "/" + day + "/" + year);

    $("#checkin").hide();
    $("#checkinButton").click(checkinTerritory);

    $("#addNew").click(addNewAddress);
});

function addNewAddress()
{
    var tableRows = document.getElementById("tertable").children;
    var index = tableRows.length;
    var newAddrData = [];
    newAddrData[0] = "";
    newAddrData[1] = "";
    newAddrData[2] = "";
    newAddrData[3] = "";
    newAddrData[7] = "";
    newAddrData[9] = "";
    newAddrData[14] = "";
    writeTableRow(newAddrData, index);
}

function writeTableHeaderRow()
{
    var table = document.getElementById("tertable");
    var tableBody = document.createElement('thead');
    var row = document.createElement('tr');
    
    // Create columns
    
    var cell = document.createElement('td');
    cell.className = "index-head";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "name";
    cell.innerHTML = "Name";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "housenum";
    cell.innerHTML = "House Number";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "street";
    cell.innerHTML = "Street";
    row.appendChild(cell);
    
    cell = document.createElement('td');
    cell.className = "city";
    cell.innerHTML = "City";
    row.appendChild(cell);
    
    cell = document.createElement('td');
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
    
    // Index
    var cell = document.createElement('td');
    cell.className = "index";
    cell.innerHTML = index;
    row.appendChild(cell);
    
    // Name
    cell = document.createElement('td');
    cell.className = "name";
    if (rowData[0] == null)
    {
        rowData[0] = "";
    }
    cell.innerHTML = "<input type='text' id='name' value='" + toTitleCase(rowData[0]) + "'>";
    row.appendChild(cell);
    
    // House Number
    cell = document.createElement('td');
    cell.className = "housenum";
    cell.innerHTML = "<input type='text' id='housenum' value='" + rowData[1] + "'>";
    row.appendChild(cell);
    
    // Street
    cell = document.createElement('td');
    cell.className = "street";
    cell.innerHTML = "<input type='text' id='street' value='" + toTitleCase(rowData[2]) + "'>";
    row.appendChild(cell);

    // City 
    cell = document.createElement('td');
    cell.className = "city";
    cell.innerHTML = "<input type='text' id='city' value='" + toTitleCase(rowData[3]) + "'>";
    row.appendChild(cell);
    dbAddresses[index] = [rowData[1], rowData[2], rowData[3]];
    
    // Confirmed
    cell = document.createElement('td');
    cell.className = "conf";
    cell.innerHTML = "<select id='confSelect'><option value='Yes'>Yes</option><option value='No'>No</option><option value='Not CH'>Not CH</option></select>";
    row.appendChild(cell);
    if ( rowData[14] == 1 || rowData[14] == "Yes" )
    {
        cell.querySelector("#confSelect").value="Yes";
    }
    else if ( rowData[14] == 0 || rowData[14] == "No" )
    {
        cell.querySelector("#confSelect").value="No";
    }
    else
    {
        cell.querySelector("#confSelect").value="Not CH";
    }
    
    // Notes
    cell = document.createElement('td');
    cell.className = "notes";
    if (rowData[7] == null)
    {
        rowData[7] = "";
    }
    cell.innerHTML = "<input type='text' id='notes' value=\"" + rowData[7] + "\">";
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

function checkinTerritory()
{
    // Mark selected territory as checked in
    var menu = document.getElementById("termenu");
    var tername = menu.options[menu.selectedIndex].value;
    var command = "UPDATE territory SET free=\"TRUE\" WHERE tername=\"" + tername + "\";";
    var res = db.exec(command);

    // Mark check out date from text box
    var date = $("#inDate").val();
    command = "UPDATE territory SET indate = \"" + date + "\" WHERE tername=\"" + tername + "\";";
    res = db.exec(command);

    var tableRows = document.getElementById("tertable").children;
    // For each address, write the data out
    // Start at 1 to skip thead
    for (var i = 1; i < tableRows.length; i++)
    {
        var data = tableRows[i];

        var name = data.children[1].children[0].value;
        var housenum = data.children[2].children[0].value;
        var street = data.children[3].children[0].value;
        var city = data.children[4].children[0].value;
        var confirmed = data.children[5].children[0].value;
        var notes = data.children[6].children[0].value;

        command = "SELECT count(*) FROM master WHERE housenum=\"" + dbAddresses[i][0] + "\" AND street=\"" + dbAddresses[i][1] + "\" AND city=\"" + dbAddresses[i][2] + "\";";
        res = db.exec(command);
        try 
        {
            if (res[0].values[0] >= 1)
            {
                // Name
                command = "UPDATE master SET name = \"" + name + "\" WHERE housenum=\"" + dbAddresses[i][0] + "\" AND street=\"" + dbAddresses[i][1] + "\" AND city=\"" + dbAddresses[i][2] + "\";";
                res = db.exec(command);
                //console.log(name);

                // Confirmed
                command = "UPDATE master SET confirmed = \"" + confirmed + "\" WHERE housenum=\"" + dbAddresses[i][0] + "\" AND street=\"" + dbAddresses[i][1] + "\" AND city=\"" + dbAddresses[i][2] + "\";";
                res = db.exec(command);
                //console.log(street);
                
                // Notes
                command = "UPDATE master SET notes = \"" + notes + "\" WHERE housenum=\"" + dbAddresses[i][0] + "\" AND street=\"" + dbAddresses[i][1] + "\" AND city=\"" + dbAddresses[i][2] + "\";";
                res = db.exec(command);
                //console.log(notes);

                // Update House number, street, and city last to make searches stay correct
                command = "UPDATE master SET housenum=\"" + housenum + "\", street=\"" + street + "\", city=\"" + city + "\" WHERE housenum=\"" + dbAddresses[i][0] + "\" AND street=\"" + dbAddresses[i][1] + "\" AND city=\"" + dbAddresses[i][2] + "\";";
                res = db.exec(command);
                console.log("Address updated: " + String(dbAddresses[i]));
            }
            else if (housenum != "" && street != "" && city != "")
            {
                command = 'INSERT INTO master (name, housenum, street, city, state, confirmed, notes, tername) VALUES ("' + name + '","' + housenum + '","' + street + '","' + city + '","' + "CA" + '","' + confirmed + '","' + notes + '","' + tername + '");';
                console.log(command);
                res = db.exec(command);

                // Store addresses in local records
                dbAddresses[i] = [housenum, street, city];
                console.log("New address added: " + String(dbAddresses[i]));
            }
        }
        catch (err)
        {
            console.log("Address error: " + housenum + " " + street + " " + city + " had error: " + err.message);
        }
    }

    // Read out selected territory
    var data = db.export();
    var blob = new Blob([data], {type: "application/x-sqlite3;charset=" + document.characterSet});
    saveAs(blob, "territory.db");
    console.log("File save done");
}