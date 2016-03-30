'use strict';

module.exports = {
    port: 9090,

    iot: {
        protocol: 'amqps',
        sasName: 'iothubowner',
        sasKey: process.env.SASKEY,
        eventHubHost: 'ihsuprodsgres007dednamespace.servicebus.windows.net',
        eventHubName: 'iothub-ehub-gallon-hub-25662-1a128f84d6',
        get uri() {
            return `${this.protocol}://${encodeURIComponent(this.sasName)}:${encodeURIComponent(this.sasKey)}@${this.eventHubHost}`;
        },
    },

    mongodb: {
        host: 'localhost',
        port: 27017,
        dbname: 'gallondb',
        username: '',
        password: '',
        get connectionString() {
            return `mongodb://${this.host}:${this.port}/${this.dbname}`;
        },
    },

    mandrill: {
        key: process.env.MANDRILLKEY,
        from: 'no-reply-gallon@dycodex.com',
    },

    sender: {
        connectionString: process.env.DEVICESTRING || '',
        deviceId: 'gallon01-watcher01',
    },
};
