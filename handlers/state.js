'use strict';

const Promise = require('bluebird');
const config = require('../config/' + (process.env.APPENV || ''));
const iotHubClient = Promise.promisifyAll(require('../helpers/init_sender')(config));
const Message = require('azure-iot-device').Message;

module.exports = function stateHandlerFactory(socket, db) {
    return function stateHandler(message) {
        let payload = message;

        if (typeof message === 'string') {
            try {
                payload = JSON.parse(message);
            } catch (ex) {
                console.error('Not a valid JSON.');
            }
        }

        console.log('Got state message');

        const deviceId = message.deviceId;
        const collection = db.collection('devices');
        const query = {
            'device.id': deviceID,
        };

        const update = {
            $set: {
                'attr.state': parseInt(message.body.state),
            },
        };

        return collection.findOneAndUpdate(query, update)
            .then(iotHubClient.openAsync())
            .then(() => {
                const data = {
                    name: 'control',
                    parameters: {
                        state: message.state
                    },
                };

                const message = new Message(data);

                return iotHubClient.sendEventAsync(message);
            })
            .then(() => {
                console.log('Control event is sent to Azure IoT Hub');
                iotHubClient.closeAsync();
            })
            .catch(e =>  {
                console.error('Failed to send event.', e)
                iotHubClient.closeAsync();
            });
    };
};
