#!/usr/bin/env node
'use strict';
/**
 * Module dependencies.
 */
const app = require('./app');
const logger = require('./utils/logger');
const http = require('http');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork(); // create a worker
    }
    cluster.on('exit', (worker, code, signal) => {
        // Do something when a worker crashes, typically
        // log the crash and start a new worker.
        logger.error(worker, code, signal);
    });
} else {
    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val) {
        const port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }
        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Setting node env as production when there is NODE_ENV variable available.
     */
    if (process.env.ONEOPS_ENVIRONMENT && process.env.ONEOPS_ENVIRONMENT.indexOf(
            'dev') === -1) {
        process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    } else {
        process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    }


    /**
     * Get ports from environment and store in Express.
     */

    const httpPort = normalizePort(process.env.PORT || '8000');
    app.set('httpPort', httpPort);


    /**
     * Create HTTP server.
     */

    const httpServer = http.createServer(app);
    httpServer.listen(httpPort);


    /**
     * Event listener for HTTP server 'error' event.
     */

    httpServer.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }
        // handle specific listen errors with friendly messages
        switch (error.code) {
        case 'EACCES':
            logger.error(`${error.port} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(`Port ${error.port} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
        }
    });

    /**
     * Event listener for HTTP server 'listening' event.
     */
    httpServer.on('listening', () => {
        const httpAddr = httpServer.address();
        const httpBind = typeof httpAddr === 'string' ? `pipe ${httpAddr}` : `port ${httpAddr.port}`;
        logger.info(`Listening on ${httpBind}`);
    });
}
