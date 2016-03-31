'use strict';

module.exports = function(deviceData) {
    const deviceTemplate = {
        device: {
            name: 'Gallon',
            types: 'SmartGallon',
            subtypes: 'SmartGallon',
            id: deviceData.id,
        },
        attr: {
            state: 1,
            waterLevelPercent: deviceData.waterLevelPercent || 100,
            ldr: deviceData.ldr || 1,
        },
        config: {
            appPaired: 1,
            sensorOrientation: 1,
            locationName: 'IoT',
        },
        account: deviceData.account || {
            userId: 'stub2',
            userToken: 'stub2',
        },
    };

    return deviceTemplate;
};
