'use strict';

const Promise = require('bluebird');
const config = require('../config/' + (process.env.APPENV || ''));
const iotHubClient = Promise.promisifyAll(require('../helpers/init_sender')(config));
const Message = require('azure-iot-common').Message;

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

        const deviceId = payload.deviceId;
        const collection = db.collection('devices');
        const query = {
            'device.id': deviceId,
        };

        const update = {
            $set: {
                'attr.state': parseInt(payload.state),
            },
        };

        return iotHubClient.openAsync()
            .then(() => {
                const data = {
                    name: 'control',
                    parameters: {
                        state: payload.state
                    },
                };

                const message = new Message(JSON.stringify(data));

                console.log('Sending to', deviceId, message.getData());

                // return iotHubClient.sendEventAsync(message);
                return iotHubClient.sendAsync(deviceId, message)
                // return Promise.resolve(true);
            })
            .then(() => {
                console.log('Control event is sent to Azure IoT Hub');
                socket.emit('getState', JSON.stringify({ deviceId, state: payload.state }));

                return iotHubClient.closeAsync();
            })
            .then(() => collection.findOneAndUpdate(query, update))
            .catch(e =>  {
                console.error('Failed to send event.', e)
                iotHubClient.closeAsync();
            });
    };
};
