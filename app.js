'use strict';

// Connect to IoT hub reference: https://azure.microsoft.com/en-us/documentation/articles/iot-hub-node-node-getstarted/

const socketio = require('socket.io');
const amqp = require('amqp10');
const Promise = require('bluebird');
const mongodb = require('mongodb');

const config = require('./config/' + (process.env.APPENV || ''));
const handlers = require('./handlers/default');
const stateControlFactory = require('./handlers/state');

const MongoClient = mongodb.MongoClient;
const Policy = amqp.Policy;
const translator = amqp.translator;
const AMQPClient = amqp.Client;

const io = socketio(config.port, {
    transports: ['websocket', 'polling', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
});

const filterOffset = new Date().getTime();
const filterOption = {
    attach: {
        source: {
            filter: {
                'apache.org:selector-filter:string': translator(
                    [
                        'described',
                        [
                            'symbol',
                            'apache.org:selector-filter:string'
                        ],
                        [
                            'string',
                            `amqp.annotation.x-opt-enqueuedtimeutc > ${filterOffset}`
                        ]
                    ]
                ),
            }
        }
    }
};
const receiveAddr = config.iot.eventHubName + '/ConsumerGroups/$default/Partitions/';

const client = new AMQPClient(Policy.EventHub);

function partitionReceive(partitionId, address, filter, handlers) {
    return client.createReceiver(address, filter)
        .then(receiver => {
            console.log('EventHub listen on partition ', partitionId);

            receiver.on('message', handlers.onMessage.bind(null, partitionId));
            receiver.on('errorReceived', handlers.onError.bind(null, partitionId));
        });
}

let handler;

MongoClient.connect(config.mongodb.connectionString)
    .then(db => {
        console.log('Connected to MongoDB');
        console.log('Connecting to Azure IoT Hub');

        handler = handlers(io, db);

        io.on('connection', socket => {
            function onDisconnect(socket) {
                console.log('Disconnected', socket.id);
            }

            socket.on('disconnect', onDisconnect.bind(null, socket));
            socket.on('disconnected', onDisconnect.bind(null, socket));
            socket.on('setState', stateControlFactory(socket, db));

            console.log('socket.io Received connection');
        });

        return client.connect(config.iot.uri);
    })
    .then(() => {
        console.log('Connected to Azure IoT Hub');
        const partitions = [];

        for (let i = 0; i < 2; i++) {
            partitions.push(partitionReceive(i, receiveAddr + i, filterOption, handler));
        }

        return Promise.resolve(true);
    })
    .catch(e => {
        console.error('Caught: ', e.stack);
    });

process.on('uncaughtException', err => {
    console.error('uncaughtException', err.stack);
});
