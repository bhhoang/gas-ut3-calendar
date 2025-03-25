function getCalendarData() {
  var url = 'https://edt.univ-tlse3.fr/calendar/Home/GetCalendarData';
  // Get today's date
  var today = new Date();
  
  // Format the date to 'YYYY-MM-DD' for the start date
  var startDate = "09/09/2024";
  
  // Calculate cmthe date 7 days from today
  var endDate = new Date(today);
  endDate.setDate(today.getDate() + 300);
  endDate = endDate.getFullYear() + '-' + 
                         ('0' + (endDate.getMonth() + 1)).slice(-2) + '-' + 
                         ('0' + endDate.getDate()).slice(-2);
 


  // Construct the POST request body
  var payload = {
    'start': startDate,
    'end': endDate,
    'resType': '103',
    'calView': 'month',
    'federationIds[]': '27762',
    'colourScheme': '1'
  };

  let cookieHeader = getCookies('cookies.txt');

  // Logger.log(cookieHeader);
  // Set the headers for the request
  var headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'cookie': cookieHeader,
      'origin': 'https://edt.univ-tlse3.fr',
      'priority': 'u=1, i',
      'referer': 'https://edt.univ-tlse3.fr/calendar/cal?vt=month&dt=2024-09-17&et=group&fid0=27762',
      'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
      'x-requested-with': 'XMLHttpRequest'
    }

  // Prepare the options for the POST request
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': headers,
    'muteHttpExceptions': true
  };

  // Make the request
  var response = UrlFetchApp.fetch(url, options);

  if (response.getContentText() == ''){
    authorize_jump();
    cookieHeader = getCookies('cookies.txt');
    headers['cookie'] = cookieHeader;
    options[headers] = headers;
    response = UrlFetchApp.fetch(url, options)
    return response.getContentText()
  }
  // Log the response
  return response.getContentText();
}

function decodeHTMLComponents(text){
    let doc = XmlService.parse('<root>' + text + '</root>');
    let decodedString = doc.getRootElement().getText();
  
  return decodedString;
}

function cleanDescription(description) {
	return description.replace(/(<br \/>|[\r])/g, "")
			  .replace(/[\n]+/g, "\n")
			  .replace(/&#232;/g,"è")
			  .replace(/&#233;/g,"è")
			  .replace(/&#226;/g,"â")
        .replace(/&#224;/g, "à")
        .replace(/&#231;/g,"ç")
        .replace(/&#39;/g, "'")

// return HtmlService.createHtmlOutput(description).getContent();

}


function parseDescription(description) {
	const details = description.split("\n")
	return {
		type: details[0],
		title: details[1].split(" - ")[0],
		course: details[1].split(" - ")[1],
		room: details[2],
		group: details[3]
	}
}

function getCategoryColor(category) {
    switch (category) {
        case "COURS":
            return "#8080ff";
        case "TD":
            return "#ff8080";
        case "TP":
            return "#408080";
        case "REUNION / RENCONTRE":
            return "#ffff80";
        case "CONTROLE CONTINU":
            return "#808000";
        default:
            return "#ffc4c4";
    }
}

function formatDateInner(dateString) {
	return dateString.replace(/([-:]|\.[0-9]+)/g, "")
}

function dataToIcal(data) {
    let result = "BEGIN:VCALENDAR\r\n";
    result += "VERSION:2.0\r\n";
    result += "PRODID:-//Robotechnic//Univ Toulouse III//CELCAT//FR\r\n";
    result += "CALSCALE:GREGORIAN\r\n";
    result += "METHOD:PUBLISH\r\n";
    result += "X-WR-CALNAME:CELCAT-EDT\r\n";
    result += "X-WR-TIMEZONE:Europe/Paris\r\n";

    const dstamp = `DTSTAMP:${formatDateInner(new Date().toISOString())}\r\n`;

    for (const event of data) {
        if (event.eventCategory === "CONGES" || event.eventCategory === "FERIE" || event.eventCategory === "PONT") continue;

        event.description = cleanDescription(event.description);
        const details = parseDescription(event.description);
        const categoryColor = getCategoryColor(event.eventCategory);
        const event_description = decodeHTMLComponents(event.description.replace(/\n/g,"\\n").replace(/\\n$/, ''));
        // Logger.log(details)

        if (details.course){
          details.course = `${details.type} - ${details.course}`;
        }

        result += "BEGIN:VEVENT\r\n";
        result += `UID:${event.id}\r\n`;
        result += dstamp;
        result += `DTSTART:${formatDateInner(event.start)}\r\n`;
        result += `DTEND:${formatDateInner(event.end)}\r\n`;
        result += `SUMMARY:${(details.course) ?  details.course : details.type || 'Undefined Event'}\r\n`;
        result += `DESCRIPTION:${event_description}\r\n`; // Ensure no trailing \n
        result += `LOCATION:${details.room || ''}\r\n`;
        result += `CATEGORIES:${event.eventCategory}\r\n`;
        result += `COLOR:${categoryColor}\r\n`;
        result += "END:VEVENT\r\n";
    }

    result += "END:VCALENDAR\r\n";
    return result;
}


function decodeHTMLComponents(text){
    let doc = XmlService.parse('<root>' + text + '</root>');
    let decodedString = doc.getRootElement().getText();
  
  return decodedString;
}

function cleanDescription(description) {
	return description.replace(/(<br \/>|[\r])/g, "")
			  .replace(/[\n]+/g, "\n")
			  .replace(/&#232;/g,"è")
			  .replace(/&#233;/g,"è")
			  .replace(/&#226;/g,"â")
        .replace(/&#224;/g, "à")
        .replace(/&#231;/g,"ç")
        .replace(/&#39;/g, "'")

// return HtmlService.createHtmlOutput(description).getContent();

}


function parseDescription(description) {
	const details = description.split("\n")
	return {
		type: details[0],
		title: details[1].split(" - ")[0],
		course: details[1].split(" - ")[1],
		room: details[2],
		group: details[3]
	}
}

function getCategoryColor(category) {
    switch (category) {
        case "COURS":
            return "#8080ff";
        case "TD":
            return "#ff8080";
        case "TP":
            return "#408080";
        case "REUNION / RENCONTRE":
            return "#ffff80";
        case "CONTROLE CONTINU":
            return "#808000";
        default:
            return "#ffc4c4";
    }
}

function formatDateInner(dateString) {
	return dateString.replace(/([-:]|\.[0-9]+)/g, "")
}

function dataToIcal(data) {
    let result = "BEGIN:VCALENDAR\r\n";
    result += "VERSION:2.0\r\n";
    result += "PRODID:-//Robotechnic//Univ Toulouse III//CELCAT//FR\r\n";
    result += "CALSCALE:GREGORIAN\r\n";
    result += "METHOD:PUBLISH\r\n";
    result += "X-WR-CALNAME:CELCAT-EDT\r\n";
    result += "X-WR-TIMEZONE:Europe/Paris\r\n";

    const dstamp = `DTSTAMP:${formatDateInner(new Date().toISOString())}\r\n`;

    for (const event of data) {
        if (event.eventCategory === "CONGES" || event.eventCategory === "FERIE" || event.eventCategory === "PONT") continue;

        event.description = cleanDescription(event.description);
        const details = parseDescription(event.description);
        const categoryColor = getCategoryColor(event.eventCategory);
        const event_description = decodeHTMLComponents(event.description.replace(/\n/g,"\\n").replace(/\\n$/, ''));
        // Logger.log(details)

        if (details.course){
          details.course = `${details.type} - ${details.course}`;
        }

        result += "BEGIN:VEVENT\r\n";
        result += `UID:${event.id}\r\n`;
        result += dstamp;
        result += `DTSTART:${formatDateInner(event.start)}\r\n`;
        result += `DTEND:${formatDateInner(event.end)}\r\n`;
        result += `SUMMARY:${(details.course) ?  details.course : details.type || 'Undefined Event'}\r\n`;
        result += `DESCRIPTION:${event_description}\r\n`; // Ensure no trailing \n
        result += `LOCATION:${details.room || ''}\r\n`;
        result += `CATEGORIES:${event.eventCategory}\r\n`;
        result += `COLOR:${categoryColor}\r\n`;
        result += "END:VEVENT\r\n";
    }

    result += "END:VCALENDAR\r\n";
    return result;
}


function saveIcalFile(icalData, fileName) {
  // Save iCal data as a file in Google Drive
  var folder = DriveApp.getFolderById('1Rnw78UWvZLpcCGsqGXT2IBiO19o_LXlp'); // You need to replace <YOUR_FOLDER_ID> with your folder ID or use DriveApp.createFolder() to create a new folder
  var files = folder.getFilesByName(fileName + '.ics');

  // Delete all files with the same name
  while (files.hasNext()) {
    var fileToDelete = files.next();
    Logger.log('Deleting file: ' + fileToDelete.getName());
    fileToDelete.setTrashed(true); // Move the file to trash
  }
  
  var file = folder.createFile(fileName + '.ics', icalData, MimeType.PLAIN_TEXT);

  // Make the file public and get the shareable link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl(); // Returns the public link to the file
}
