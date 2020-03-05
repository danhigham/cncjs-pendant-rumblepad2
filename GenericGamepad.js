
const HID = require( 'node-hid' );
const EventEmitter = require( 'events' );

class GenericGamepad extends EventEmitter {
	
	constructor() {
		super();
		this.setMaxListeners(50)
		this._hid = new HID.HID(121,17);
		this._state = {
			dpad: 0,
			buttons: [
				['left', 6, 0, 0],
				['right', 6, 1, 0],
				['select', 6, 4, 0],
				['start', 6, 5, 0],
				['x', 5, 4, 0],
				['y', 5, 7, 0],
				['a', 5, 5, 0],
				['b', 5, 6, 0]
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

	_process(data) {
		
		// Process Dpad
		var currentState = ((data[3] << 8) + data[4])
		if(currentState != this._state['dpad']){
			this._state.dpad = currentState;
			this.emit( 'dpad', currentState );
			console.log(data);
		} 


		// Process Buttons
		for (var i = 0; i < len(this._state.buttons); i++) {

			currentState = data[this._state.buttons[i][1]] & (1 << this._state.buttons[i][2]) ? 1 : 0;

			if(currentState != this._state.buttons[i][3]){
				this._state.buttons[i][3] = currentState;
				
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

module.exports = GenericGamepad;
