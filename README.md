Gallon Watcher (Websocket)
==========================

Listen for every incoming data from Azure IoT Hub and re-emit it via websocket to dashboard & Windows 10 app.

## Running the app

Using nodemon (development)
```sh
APPENV=local nodemon app.js
```

Using pm2 (production)
```sh
SASKEY=YOUR_SAS_KEY pm2 start app.js --name gallonw-watcher-ws
```

## Note on APPENV variable

`APPENV` environment variable is used to identify configuration file which is being used by the app. The possible values are `dev.local`, `local`, or `production`.

`APPENV` can be omitted when running app on production environment. However, you **should** define `SASKEY` variable that contains your Azure IoT Hub policy primary key.