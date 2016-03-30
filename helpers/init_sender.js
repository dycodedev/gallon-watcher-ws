'use strict';

const azureAmqp = require('azure-iot-device-amqp');
const clientFromConnectionString = azureAmqp.clientFromConnectionString;

module.exports = function initSender(config) {
    return clientFromConnectionString(config.sender.connectionString);
};
