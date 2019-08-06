const TeleBot = require('telebot');
const bot = new TeleBot('716531720:AAH-zjR1tE4bZbJdh4NqXAqLpx13VBgPP_c');
// var auth = require('./auth');

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {Function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

var data = null;



bot.on('/score', (msg) => {

    /**
     * Prints the names and majors of students in a sample spreadsheet:
     * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
     * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
     */
    function getInfo(auth) {
        const sheets = google.sheets({ version: 'v4', auth });
        sheets.spreadsheets.values.get({
            spreadsheetId: '1o72r57c0EeBxUS1I7Hf44iKac9YS29UlK-QH1tWqbuw',
            range: 'ShanJios!A2:C',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res.data.values;
            if (rows.length) {
                console.log('Level, Name, Score:');
                // Print columns A and E, which correspond to indices 0 and 4.
                // rows.map((row) => {
                //     console.log(`${row[0]}, ${row[1]}, ${row[2]}`);
                //     msg.reply.text(`${row[0]}, ${row[1]}, ${row[2]}`);
                // });

                var data = processRows(rows);

                bot.sendMessage(msg.chat.id, formatData(data), { parseMode: "HTML" });


                // data = JSON.parse(JSON.stringify(rows));
            } else {
                console.log('No data found.');
            }
        });
    }
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), getInfo);

    });

});

function processRows(rows) {
    var data = {
        '4': [],
        '5': [],
        '6': [],
        '7': []
    };
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i]; //column
        var level = row[0]; 
        var name = row[1];
        var score = row[2];

        data[level].push([name, score]);
    }

    console.log(data);
    return data;
}

function formatData(data) {
    var output = "<b>SCORES:\n\n</b>";

    for (var i = 4; i < 8; i++) { // iterate through levels
        output += "<b>Level " + i + "</b>\n";
        var level = data["" + i]; 
        var sum = 0;
        for (var j = 0; j < level.length; j++) {  
            output += level[j][0] + ": " + level[j][1] + "\n";
            sum += Number(level[j][1]);
        }
        output += "<b>Total Score: </b>" + sum + "\n\n";
    }

    return output;
}

// bot.on('text', (msg) => msg.reply.text(msg.text));

bot.start();