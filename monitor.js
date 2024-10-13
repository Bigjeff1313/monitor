const https = require('https');
const fs = require('fs');
const winston = require('winston');

const url = 'https://server4info0.site/com/cum.txt';
const telegramToken = '7265284412:AAH0G6BW85J3JaYgZDSa9rDyJG80YTdBaEU';
const chatId = '5845506396';
const previousContentFile = 'previousContent.txt';

// Set up logging with winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logfile.log' })
    ]
});

// Function to send a message to Telegram
function sendTelegramMessage(message) {
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

    https.get(telegramUrl, (res) => {
        if (res.statusCode === 200) {
            logger.info(`Message sent to Telegram: ${message}`);
        } else {
            logger.error(`Failed to send message: ${res.statusCode}`);
        }
    }).on('error', (err) => {
        logger.error(`Error sending message: ${err.message}`);
    });
}

// Function to fetch content from the URL
function fetchContent() {
    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            checkForChanges(data);
        });
    }).on('error', (err) => {
        logger.error(`Error fetching data: ${err.message}`);
    });
}

// Function to check for changes
function checkForChanges(newContent) {
    fs.readFile(previousContentFile, 'utf8', (err, oldContent) => {
        if (err && err.code !== 'ENOENT') {
            logger.error(`Error reading previous content: ${err.message}`);
            return;
        }

        // Compare old content with new content
        if (oldContent !== newContent) {
            logger.info('Content changed, sending update to Telegram.');
            sendTelegramMessage(newContent);
            
            // Update the previous content file
            fs.writeFile(previousContentFile, newContent, (err) => {
                if (err) {
                    logger.error(`Error writing new content: ${err.message}`);
                }
            });
        }
    });
}

// Send initial message to confirm webhook is active
sendTelegramMessage(`Webhook monitoring has started. Monitoring the content at ${url}.`);

// Start monitoring and log status
logger.info('Webhook monitoring started. Fetching content every second...');
setInterval(fetchContent, 1000);
