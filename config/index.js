'use strict';

module.exports = {
    port: 9090,

    iot: {
        protocol: 'amqps',
        sasName: 'iothubowner',
        sasKey: process.env.SASKEY,
        eventHubHost: process.env.EVENTHUBHOST,
        eventHubName: process.env.EVENTHUBNAME,
        connectionString: process.env.IOT_CONNECTIONSTR,
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

    twilio: {
        sid: process.env.TWILIO_SID || '',
        token: process.env.TWILIO_TOKEN || '',
        number: process.env.TWILIO_NUMBER,
        twiml: 'http://home-x.cloudapp.net:9000/api/triggers/twiml/',
    },
};
