'use strict';

module.exports = function makeHandler(io, db) {
    const metricHandler = require('./metric')(io, db);
    const stateHandler = require('./state')(io, db);

    return {
        onError(partitionId, error) {
            console.error('Error while receiving message: ', error);
        },

        onMessage(partitionId, message) {
            console.log('Full message: ', message);
            const body = message.body;

            if (body.waterLevelPercent) {
                console.log('Emitting metric', JSON.stringify(body));

                metricHandler(message)
                    .then(() => console.log('Done processing metric'))
                    .catch(e => console.error('Failed processing metric.', e));
                io.emit('metric', body);
            }

            // if (body.state) {
            //     console.log('Emitting state', JSON.stringify(body));

            //     stateHandler(message)
            //         .then(() => console.log('Done processing state'))
            //         .catch(e => console.error('Failed processing state.', e));
            // }
        },
    };
};
