const winston = require('winston');
require("dotenv").config();

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
      Object.assign(info, { message: info.stack });
    }
    return info;
  });

const logger = winston.createLogger({
    level: process.env.APP_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
      enumerateErrorFormat(),
      process.env.APP_ENV === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
      winston.format.splat(),
      winston.format.printf(({ level, message}) => `${level}: ${message}`)
    ),
    transports: [
      new winston.transports.Console({ stderrLevels: ['error']}),
      new winston.transports.File({ filename: './logs/error.log', level: 'error',json:true,format:winston.format.combine(winston.format.timestamp(),winston.format.json())}),
      new winston.transports.File({ filename: './logs/combined.log',level:'info',json:true,format:winston.format.combine(winston.format.timestamp(),winston.format.json())}),
    ],
  });
  

module.exports = logger;
