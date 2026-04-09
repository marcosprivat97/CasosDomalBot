const express = require('express');
const logger = require('../logger');

class HealthModule {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.startTime = new Date();
        this.lastExecution = null;
        this.errors = 0;

        this.setupRoutes();
    }

    /**
     * Setup routes for the health check server.
     */
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'running',
                uptime: `${Math.floor((new Date() - this.startTime) / 1000)}s`,
                startTime: this.startTime.toISOString(),
                lastExecution: this.lastExecution,
                errors: this.errors,
                env: process.env.NODE_ENV || 'development'
            });
        });
    }

    /**
     * Starts the health check server.
     */
    start() {
        this.app.listen(this.port, () => {
            logger.info(`Servidor de monitoramento (Health) rodando em: http://localhost:${this.port}/health`);
        });
    }

    /**
     * Updates the last execution timestamp.
     */
    updateLastExecution() {
        this.lastExecution = new Date().toISOString();
    }

    /**
     * Increments the error count.
     */
    incrementErrors() {
        this.errors++;
    }
}

module.exports = new HealthModule();
