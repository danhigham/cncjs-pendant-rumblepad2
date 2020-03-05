var HID = require('node-hid');
var devices = HID.devices();

console.log(devices)

var device = new  HID.HID(devices[0].vendorId, devices[0].productId);
// var device = new HID.HID( 3727, 8);


device.on("data", function(data) {

	var state = "";
	for (var b = 0; b < data.length; b++) {
		for (var i = 7; i >= 0; i--) {
		   state += data[b] & (1 << i) ? 1 : 0;
		   // do something with the bit (push to an array if you want a sequence)
		}
		state += ':'
	}

	//console.log((data[3] << 8) + data[4])
	console.log(state);
});
