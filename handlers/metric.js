'use strict';

const Promise = require('bluebird');
const mailer = require('nodemailer');
const mandrill = require('nodemailer-mandrill-transport');
const moment = require('moment');

const config = require('../config/' + (process.env.APPENV || ''));

module.exports = function handlerFactory(io, db) {
    return function handleMetric(message) {
        const deviceCollection = db.collection('devices');
        const deviceId = message.messageAnnotations['iothub-connection-device-id'];
        const transporter = mailer.createTransport(mandrill({
            auth: {
                apiKey: config.mandrill.key,
            },
        }));
        const transport = Promise.promisifyAll(transporter);

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

        let device;
        const todos = [];

        return deviceCollection.findOne(query)
            .then(found => {
                console.log('Found device: ', found);
                device = found;

                if (!found) {
                    return Promise.throw(new Error('Device is not found'));
                }

                return Promise.resolve(device);
            })
            .then(getContacts.bind(null, db, deviceId))
            .then(contacts => {
                console.log('Found contacts: ', contacts);

                const lastAlert = device.device.lastAlert;
                console.log(lastAlert, new Date());
                console.log(moment().diff(moment(lastAlert), 'seconds'));

                if (moment().diff(moment(lastAlert), 'seconds') >= 30) {
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
                    }

                    return Promise.resolve([]);
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

function sendNotification(contact) {
    if (contact.type === 'email') {
        return sendMailAsync({
            from: config.mandrill.from,
            to: contact.to,
            subject: contact.subject || 'Gallon Notification',
            html: `<p>${contact.message}</p>`,
        });
    }

    return Promise.resolve(false);
}
