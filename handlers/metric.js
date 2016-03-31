'use strict';

const Promise = require('bluebird');
const mailer = require('nodemailer');
const mandrill = require('nodemailer-mandrill-transport');
const moment = require('moment');

const config = require('../config/' + (process.env.APPENV || ''));

const twilio = require('twilio')(config.twilio.sid, config.twilio.token);
const makeDevice = require('../helpers/generate_device');

module.exports = function handlerFactory(io, db) {
    return function handleMetric(message) {
        const deviceCollection = db.collection('devices');
        const transporter = mailer.createTransport(mandrill({
            auth: {
                apiKey: config.mandrill.key,
            },
        }));
        const transport = Promise.promisifyAll(transporter);

        let deviceId = message.messageAnnotations['iothub-connection-device-id']
            || message.body.deviceId;

        if (!deviceId) {
            return false;
        }

        const query = {
            'device.id': deviceId,
        };

        const update = {
            $set: {
                'attr.waterLevelPercent': message.body.waterLevelPercent,
                'device.lastUpdated': new Date(),
            },
        };

        if (message.body.ldr || message.body.ldr === 0) {
            update.$set['attr.ldr'] = parseInt(message.body.ldr);
        }

        let device;
        const todos = [];

        return deviceCollection.findOne(query)
            .then(found => {
                console.log('Found device: ', found);
                device = found;

                if (!found) {
                    const deviceData = {
                        id: deviceId,
                        waterLevelPercent: parseInt(message.body.waterLevelPercent),
                        ldr: parseInt(message.body.ldr),
                    };

                    return deviceCollection.insert(makeDevice(deviceData));
                    // return Promise.reject(new Error('Device is not found'));
                }

                return Promise.resolve(device);
            })
            .then(getContacts.bind(null, db, deviceId))
            .then(contacts => {
                console.log('Found contacts: ', contacts);

                const lastAlert = device.device.lastAlert;
                console.log(lastAlert, new Date());
                console.log(moment().diff(moment(lastAlert), 'seconds'));

                if (moment().diff(moment(lastAlert), 'seconds') >= 30 || !lastAlert) {
                    console.log('Gathering contact....');

                    contacts.forEach(contact => {
                        if (parseInt(message.body.waterLevelPercent) < parseInt(contact.threshold)) {
                            todos.push(contact.action);
                        }
                    });
                }

                console.log('To be alerted: ', todos);

                return Promise.each(todos, contact => {
                    if (contact.type === 'email') {
                        return transport.sendMailAsync({
                            from: config.mandrill.from,
                            to: contact.to,
                            subject: contact.subject || 'Gallon Notification',
                            html: `<p>${contact.message}</p>`,
                        });
                    } else if (contact.type === 'sms') {
                        if (/^\+([0-9]+)/.test(contact.to)) {
                            return twilio.sendMessage({
                                to: contact.to,
                                from: config.twilio.number,
                                body: contact.message,
                            });
                        }
                    }

                    return Promise.resolve(false);
                });
            })
            .then(result => {
                console.log('Send notif result:', result);

                if (todos.length > 0) {
                    update.$set['device.lastAlert'] = new Date();
                }

                return deviceCollection.findOneAndUpdate(query, update);
            });
    };
};

function getContacts(db, deviceid) {
    const query = {
        device: deviceid,
        triggerName: 'waterlevel',
    };

    const collection = db.collection('triggers');

    return collection.find(query)
        .toArray();
}