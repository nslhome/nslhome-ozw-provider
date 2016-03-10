var io = require('socket.io-client');
var core = require('nslhome-core')

var PROVIDER_TYPE = "ozw-provider";

var provider = core.provider(PROVIDER_TYPE);
var logger = core.logger(PROVIDER_TYPE);

var nodes = {};
var values = {};
var primary_class_ids = [37,48,49];
var socket = null;

var providerStarted = function(err, config) {
    if (err) {
        logger.error(err);
        process.exit(1);
    }
    logger.info("initialize with config", config);
    socket = io(config.url);

    socket.on('connect', function(){
        logger.verbose("socket connected");
        socket.emit('getNodes');
    });

    socket.on('disconnect', function(){
        logger.info("socket disconnected.  Exiting.")
        process.exit(1);
    });

    socket.on('nodes', function (n) {
        logger.verbose("got nodes");
        nodes = n;
        for (var node in nodes) {
            nodes[node].battery_value = null;
            nodes[node].primary_values = [];
            for (var comclass in nodes[node].classes) {
                for (var index in nodes[node].classes[comclass]) {
                    var value = nodes[node].classes[comclass][index];
                    values[value.value_id] = value;
                    if (value.class_id == 128) {
                        nodes[node].battery_value = value;
                    }
                    if (primary_class_ids.indexOf(value.class_id) >= 0) {
                        nodes[node].primary_values.push(value);
                    }
                }
            }
        }

        for (var value in values) {
            var v = values[value];
            if (primary_class_ids.indexOf(v.class_id) >= 0) {

                var device = {
                    id: provider.name + ":device:" + v.value_id,
                    name: nodes[v.node_id].name + " " + v.label
                };

                switch (v.class_id) {
                    case 37:
                        device.type = 'light';
                        device.lightType = 'basic';
                        device.powerState = v.value;
                        break;

                    case 48:
                        device.type = 'binarysensor';
                        device.sensorType = 'generic';
                        device.triggerState = v.value;
                        break;

                    case 49:
                        device.type = 'meter';
                        device.meterType = 'generic';
                        device.level = v.value;
                        device.unit = v.units;
                        break;
                }

                if (device.type)
                    provider.send({name: 'device', body: device});
            }
        }
    });

    socket.on('nodeEvent', function (nodeID, event, valueID) {
        logger.verbose("nodeEvent", arguments);
    });

    socket.on('sceneEvent', function (nodeID, sceneid) {
        logger.verbose("sceneEvent", arguments);
        var event = {
            id: provider.name + ":event:" + nodeID + ":" + sceneid,
            name: nodes[nodeID].name + " scene " + sceneid
        };
        provider.send({name: 'event', body: event});
    });

    socket.on('valueChanged', function (nodeID, comclass, value) {
        logger.verbose("valueChanged", arguments);

        var v = values[value.value_id];
        v.value = value.value;

        if (primary_class_ids.indexOf(v.class_id) >= 0) {
            var update = {
                id: provider.name + ":device:" + v.value_id
            };

            switch (v.class_id) {
                case 37:
                    update.powerState = v.value;
                    break;

                case 48:
                    update.triggerState = v.value;
                    break;

                case 49:
                    update.level = v.value;
                    update.unit = v.units;
                    break;
            }

            provider.send({name: 'device', body: update});
        }
    });
};


provider.on('setDevicePower', function(id, isOn) {
    id = id.split(':')[2];
    if (values[id]) {
        var v = values[id];
        socket.emit('setValue', {
            nodeID:v.node_id,
            classID:v.class_id,
            instance:v.instance,
            index:v.index,
            value:isOn
        });
    }
    else
        logger.verbose("device" + (isOn?'On':'Off') + ": Unknown device " + id);
});


module.exports = exports = start = function(configName) {
    provider.initialize(configName, providerStarted);
};

if (require.main === module) {
    start(process.argv[2]);
}
