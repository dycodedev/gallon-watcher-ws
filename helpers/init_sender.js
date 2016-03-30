'use strict';

const Client = require('azure-iothub').Client;

const azureAmqp = require('azure-iot-device-amqp');

module.exports = function initSender(config) {
    return Client.fromConnectionString(config.iot.connectionString);
};
