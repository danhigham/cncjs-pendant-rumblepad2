
const HID = require( 'node-hid' );
const EventEmitter = require( 'events' );

class CordlessRumblePad2 extends EventEmitter {
	
	// Force Feedback packet
	//                                 right left
	// device.write([0x03, 0x42, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00]);

	constructor() {
		super();
		this.setMaxListeners(50)
		this._hid = new HID.HID(1133,49689);
		this._state = {
			sticks: {
				left: {
					x: 0,
					y: 0
				},
				right: {
					x: 0,
					y: 0
				}
			},
			dpad: 0,
			buttons: [
				['b1', 0],
				['b2', 0],
				['b3', 0],
				['b4', 0],
				['l1', 0],
				['r1', 0],
				['l2', 0],
				['r2', 0],
				['b9', 0],
				['b10', 0],
				['left', 0],
				['right', 0],
			]
		};
		
		this._hid.on( 'data', this._process.bind( this ) );
		
		// on process exit, disconnect from hid.
	 	process.on( 'exit', this.disconnect.bind( this ) );

	 	//  this._hid.on('error', (err) => {
	 	//  	console.log(err);
	 	//  	process.exit(1);
	 	//  } )

	}

  disconnect () {
  	this._hid.close();
  	process.exit();
  }

	get state () {
		return this._state;
	}

	feedback (value, duration){
		// Force Feedback packet
		//                                 right left
		// device.write([0x03, 0x42, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00]);
		if(value > 255)
			value = 255;

		this._hid.write([0x03, 0x42, 0x00, value, value, 0x00, 0x00, 0x00]);
		
		setTimeout(
			function(){
				this._hid.write([0x03, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
			}.bind(this)
		,duration)
	}

	_process(data) {
		
		// Process sticks
		var byte_n = 1;
		for (var stick in this._state.sticks) {
		  var currentState = {
		  	x: data[byte_n++],
		  	y: data[byte_n++]
		  };
			if(currentState.x != this._state.sticks[stick].x || currentState.y != this._state.sticks[stick].y){
				this._state.sticks[stick] = currentState;
				this.emit( stick+':moved', currentState );
			}
		}

		// Process Dpad
		var currentState = data[5] & 15;
		if(currentState != this._state['dpad']){
			this._state.dpad = currentState;
			this.emit( 'dpad', currentState );
		} 


		// Process Buttons
		for (var i = 0; i < 12; i++) {
			if(i < 4){
				var shift = 4+i;
				var currentState = data[5]>>shift & 1
			}else{
				var shift = i-4;
				var currentState = data[6]>>shift & 1
			}

			if(currentState != this._state.buttons[i][1]){
				this._state.buttons[i][1] = currentState;
				
				var buttonName = this._state.buttons[i][0]
				
				if(currentState){
					this.emit( buttonName+':pressed' );
				}else{
					this.emit( buttonName+':released' );
				}
			}
		}
	}
}

module.exports = CordlessRumblePad2;
