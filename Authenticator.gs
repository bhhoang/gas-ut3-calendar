/*
*=========================================
*               Crawling ical
*=========================================
*/

function saveCookies(cookies, fileName) {
  // Save iCal data as a file in Google Drive
  var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER'));
  var files = folder.getFilesByName(fileName + '.txt');

  // Delete all files with the same name
  while (files.hasNext()) {
    var fileToDelete = files.next();
    Logger.log('Deleting file: ' + fileToDelete.getName());
    fileToDelete.setTrashed(true); // Move the file to trash
  }
  
  var file = folder.createFile(fileName + '.txt', cookies, MimeType.PLAIN_TEXT);
  // Make the file public and get the shareable link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl(); // Returns the public link to the file
}



function authorize_jump(){
  // Replace with the actual URL of your Vercel deployment
  var url = 'https://ut3celcat-proxy.onrender.com/calendar';

  // Replace with the credentials you need to send in the request body
  var credentials = {
    "username": PropertiesService.getScriptProperties().getProperty("USER"),
    "password": PropertiesService.getScriptProperties().getProperty("PASSWORD")
  };

  // Convert the credentials to JSON format
  var payload = JSON.stringify(credentials);
  let cookieHeader = '';
  // Set the options for the POST request
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': payload,
    'muteHttpExceptions': true  // This ensures that the script doesn't fail silently on error responses
  };

  // Send the request
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();

    // Check if the request was successful
    if (responseCode === 200) {
      cookieHeader = response.getContentText();
    } else {
      Logger.log('Error: ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('Request failed: ' + error.toString());
  }

  saveCookies(cookieHeader, 'cookies')
  
}

function getCookies(fileName) {
  // Get the folder by ID
  var folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER'));
  
  // Get all files in the folder
  var files = folder.getFilesByName(fileName);
  
  // Check if the file exists
  if (files.hasNext()) {
    // Get the first matching file
    var file = files.next();
    
    // Read the file content as a string
    var content = file.getBlob().getDataAsString();
    
    // Log or return the content
    return content;
  } else {
    authorize_jump();
    Logger.log('File not found.');
    return 'File not found.';
  }
}

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
  // Logger.log(startDate)
  // Logger.log(endDate)
  // Construct the POST request body
  var payload = {
    'start': startDate,
    'end': endDate,
    'resType': '103',
    'calView': 'month',
    'federationIds[]': '27762',
    'federationIds[]': '35491',
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
