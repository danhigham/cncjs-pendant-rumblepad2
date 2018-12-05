var HID = require('node-hid');
var devices = HID.devices();

var device = new HID.HID(1133,49689);
// var device = new HID.HID( 3727, 8);


device.on("data", function(data) {

	device.write([0x03, 0x42, 0x00, 0x62, 0xfe, 0x00, 0x00, 0x00]);
	var state = "";
	for (var b = 0; b < data.length; b++) {
		for (var i = 7; i >= 0; i--) {
		   state += data[b] & (1 << i) ? 1 : 0;
		   // do something with the bit (push to an array if you want a sequence)
		}
		state += ':'
	}
	console.log(state);
});