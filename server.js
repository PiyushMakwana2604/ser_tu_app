const express = require('express');
const logger = require('./logger');
require("dotenv").config();

// create express app
const app = express();

// Setup server port
const port = process.env.PORT || 5000;

/**
 * Code to parse request body
 */
app.use(express.text());
app.use(express.urlencoded({ extended: false}));

const app_v1 =require('./modules/v1/route_manager')
app.use('/api/v1', app_v1);

// listen for requests
try {
  app.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
  });
  
} catch (error) {
  logger.error("Failed to start server.",error);

}

