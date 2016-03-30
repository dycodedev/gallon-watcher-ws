'use strict';

const config = require('../config/' + (process.env.APPENV || ''));

module.exports = function stateHandlerFactory(iot, db) {
    return function stateHandler(message) {
        console.log('Got state message');

        const deviceId = message.messageAnnotations['iothub-connection-device-id'];
        const collection = db.collection('devices');
        const query = {
            'device.id': deviceID,
        };
        const update = {
            $set: {
                'attr.state': parseInt(message.body.state),
            },
        };

        return collection.findOneAndUpdate(query, update);
    };
};
