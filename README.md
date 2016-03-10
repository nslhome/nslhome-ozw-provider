OpenZWave Provider
=========

NslHome provider for the [OpenZWave Controller](https://github.com/nslhome/zwave-controller)

## Installation

`git clone https://github.com/nslhome/ozw-provider.git`

MongoDB and RabbitMQ configuration should be provided via the environment variables `NSLHOME_MONGO_URL` and `NSLHOME_RABBIT_URL`.

You can optionally use the file `.nslhome.env` to store your configuration.
```
export NSLHOME_MONGO_URL=mongodb://HOST/DATABASE
export NSLHOME_RABBIT_URL=amqp://USERNAME:PASSWORD@HOST
```

## Basic Usage

Provider Config
```
{
    "provider" : "ozw-provider",
    "name" : "CONFIG_NAME",
    "config" : {
        "url" : "URL_OF_OPENZWAVE_CONTROLLER"
    }
}
```

Run as a standalone application

`node ozw-provider <CONFIG_NAME>`

Include as a module

`require('ozw-provider')(CONFIG_NAME)`

## Release History

1.0.0
* Initial Release