const { createLogger, format, transports } = require('winston');

const {
  combine, timestamp, prettyPrint,
} = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [
    new transports.File({
      filename: './app/logs/error.log',
      level: 'error',
      colorize: true,
      maxsize: 5242880, // 5MB
    }),
  ],
});


module.exports = logger;
