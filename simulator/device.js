const awsIot = require('aws-iot-device-sdk');

const device = awsIot.device({
   keyPath: './private.key',
   certPath: './certificate.pem',
   caPath: './AmazonRootCA1.pem',
   clientId: 'sim-device',
   host: 'ajn6olmvk0maf-ats.iot.ap-south-1.amazonaws.com'
});

const NODES = [
  { id: 't104', tempBase: 30,  voltageBase: 11, currentBase: 120 },
  { id: 't105', tempBase: 45,  voltageBase: 33, currentBase: 250 },
  { id: 't106', tempBase: 60,  voltageBase: 66, currentBase: 400 },
];

device.on('connect', () => {
    console.log('Connected');

    setInterval(() => {
        NODES.forEach(node => {
            const data = {
                nodeId: node.id,
                temperature: (node.tempBase + Math.random() * 5).toFixed(2),
                voltage: (node.voltageBase + Math.random() * 2).toFixed(2),
                current: (node.currentBase + Math.random() * 10).toFixed(2),
                signal: (50 + Math.random() * 50).toFixed(0)
            };

            try {
                device.publish(`dt/xmerion/${node.id}/metrics`, JSON.stringify(data));
                console.log(`Sent to ${node.id}:`, data);
            } catch (err) {
                console.error(`Failed to publish to ${node.id}:`, err);
            }
        });
    }, 5000);
});