const winston = require('winston');
const path = require('path');

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        important: 2,
        info: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        important: 'magenta',
        info: 'cyan',
        debug: 'gray'
    }
};

const logger = winston.createLogger({
    levels: customLevels.levels,
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
        winston.format.colorize({ all: true, colors: customLevels.colors }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: path.join(__dirname, '..', 'logs', 'bot.log'),
            maxsize: 20971520, // 20MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.uncolorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
                })
            )
        })
    ]
});

module.exports = logger;
