Gallon Watcher (Websocket)
==========================

Listen for every incoming data from Azure IoT Hub and re-emit it via websocket to dashboard & Windows 10 app.

## Running the app

Using nodemon (development)
```sh
APPENV=local [ENVIRONMENT_VARIABLES] nodemon app.js
```

Using pm2 (production)
```sh
APPENV=production [ENVIRONMENT_VARIABLES] pm2 start app.js --name gallonw-watcher-ws
```

## Environment variables

You can omit these variables by replacing their reference inside the configuration file.

* `APPENV` environment variable is used to identify configuration file which is being used by the app. The possible values are `dev.local`, `local`, or `production`.
* `SASKEY` is a primary key of the IoT hub owner.
* `EVENTHUBHOST` is an event hub host that is provided by your IoT hub.
* `EVENTHUBNAME` is an event hub name that is provided by your IoT hub.
* `IOT_CONNECTIONSTR`  is an IoT hub owner connection string.
* `MANDRILLKEY` is a Mandrill service key.
* `TWILIO_SID` is your Twilio SID value.
* `TWILIO_TOKEN` is your Twilio token value.
* `TWILIO_NUMBER` is your registered Twilio phone number.

