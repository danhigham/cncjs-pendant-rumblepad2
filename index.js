#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const get = require('lodash.get');
const GenericPad = require(path.resolve( __dirname, "./GenericGamepad.js" ));

const generateAccessToken = function(payload, secret, expiration) {
    const token = jwt.sign(payload, secret, {
        expiresIn: expiration
    });

    return token;
};

// Get secret key from the config file and generate an access token
const getUserHome = function() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

module.exports = function(options, callback) {
    options = options || {};
    options.secret = get(options, 'secret', process.env['CNCJS_SECRET']);
    options.baudrate = get(options, 'baudrate', 115200);
    options.socketAddress = get(options, 'socketAddress', 'localhost');
    options.socketPort = get(options, 'socketPort', 8000);
    options.controllerType = get(options, 'controllerType', 'Grbl');
    options.accessTokenLifetime = get(options, 'accessTokenLifetime', '30d');


    var pendant_started = false;


    connectPendant ()
    // ###########################################################################
    // Start Socket Connection & Controller Conection
    function connectPendant () {
        const cncrc = path.resolve(getUserHome(), '.cncrc');
	var config;
        try {
            config = JSON.parse(fs.readFileSync(cncrc, 'utf8'));
        } catch (err) {
            console.error('Failed with config file')
	        console.error(err);
            process.exit(1);
        }
        if (!options.secret) {
            options.secret = config.secret;
        }

        

        var warmUpCommand =  config.mdi.find(obj => { return obj.name == 'WarmUp'})
        var zProbeCommand =  config.mdi.find(obj => { return obj.name == 'Z-Probe'})
        var boundaryMacro =  config.macros.find(obj => { return obj.name == 'boundary'})

        const token = generateAccessToken({ id: '', name: 'pendant' }, options.secret, options.accessTokenLifetime);
        const url = 'ws://' + options.socketAddress + ':' + options.socketPort + '?token=' + token;

        socket = io.connect('ws://' + options.socketAddress + ':' + options.socketPort, {
            'query': 'token=' + token
        });

        socket.on('connect', () => {
            console.log('Connected to ' + url);

            // Open port
            socket.emit('open', options.port, {
                baudrate: Number(options.baudrate),
                controllerType: options.controllerType
            });
        });

        socket.on('error', (err) => {
            console.error('Connection error.');
            if (socket) {
                socket.destroy();
                socket = null;
            }
        });

        socket.on('close', () => {
            console.log('Connection closed.');
        });

        socket.on('serialport:open', function(options) {
            options = options || {};

            console.log('Connected to port "' + options.port + '" (Baud rate: ' + options.baudrate + ')');

            callback(null, socket);
        });

        socket.on('serialport:write', function(data) {
            console.log((data || '').trim());
        });

        socket.on('serialport:error', function(options) {
            callback(new Error('Error opening serial port "' + options.port + '"'));
        });

        socket.on('serialport:read', function(data) {
            console.log((data || '').trim());
            if (data.trim() == "[MSG:Caution: Unlocked]")
                controller.feedback(255,200);

            if (data.trim() == "Grbl 1.1f ['$' for help]")
                controller.feedback(255,200);
        });
        
        controller = new GenericPad();

        
        // // SHIFTS
        // // L1
        // var l1 = false;
        // controller.on('left:pressed', function(data) {
        //     l1 = true;
        // });
        // controller.on('left:released', function(data) {
        //     l1 = false;
        //     //console.log(data + '|' + l1);
        // });

        // // R1
        // var r1 = false;
        // controller.on('right:pressed', function(data) {
        //     r1 = true;
        //     //console.log(data + '|' + r1);
        // });
        // controller.on('right:released', function(data) {
        //     r1 = false;
        //     //console.log(data + '|' + r1);
        // });


        // // Reset
        // controller.on('b9:pressed', function(data) {
        //     if (l1) {
        //         socket.emit('command', options.port, 'reset');
        //     }
        // });

        // // Start
        // controller.on('start:pressed', function(data) {
        //     if (!r1 && !l1 && !r2) {
        //         socket.emit('command', options.port, 'gcode:start');
        //         //console.log('cyclestart:' + data);
        //     }
        // });

        // // Stop
        // controller.on('b3:pressed', function(data) {
        //     if (!r1 && !l1) {
        //         socket.emit('command', options.port, 'gcode', 'M30');
        //         //console.log('feedhold:' + data);
        //     }
        // });


        // // Pause
        // controller.on('b2:pressed', function(data) {
        //     if (!r1 && !l1) {
        //         socket.emit('command', options.port, 'gcode:pause');
        //         //console.log('pause:' + data);
        //     }
        // });

        // // Resume
        // controller.on('b4:pressed', function(data) {
        //     if (!r1 && !l1) {
        //         socket.emit('command', options.port, 'gcode:resume');
        //         //console.log('unlock:' + data);
        //     }
        // });

        // // Sleep
        // controller.on('b9:pressed', function(data) {
        //     if (l2) {
        //         socket.emit('command', options.port, 'sleep');
        //     }
        // });


        // // Raise Z
        // controller.on('b4:pressed', function(data) {
        //     if (r1) {    
        //         move_z_axis = 1;
        //         jog();
        //     }
        // });

        // controller.on('b4:released', function(data) {
        //     move_z_axis = 0;
        // });

        // controller.on('b2:pressed', function(data) {
        //     if (r1) {
        //         move_z_axis = -1;
        //         jog();            
        //     }
        // });

        // controller.on('b2:released', function(data) {
        //     move_z_axis = 0;
        // });

        // // Zero out work offsets
        // controller.on('right:pressed', function(data) {
        //     if(r1){
        //         socket.emit('command', options.port, 'gcode', 'G10 L20 P1 Z0');
        //         controller.feedback(200,200);
        //     }else{
        //         socket.emit('command', options.port, 'gcode', 'G10 L20 P1 X0');
        //         socket.emit('command', options.port, 'gcode', 'G10 L20 P1 Y0');
        //         controller.feedback(200,200);
        //     }
        // });

        // // Goto zeros
        // controller.on('left:pressed', function(data) {
        //     if(r1)
        //         socket.emit('command', options.port, 'gcode', 'G0 Z0');
        //     else
        //         socket.emit('command', options.port, 'gcode', 'G0 X0 Y0 F5000');
        // });


        // // Z-Probe
        // controller.on('b3:pressed', function(){
        //     if(r1 && (typeof zProbeCommand != 'undefined'))
        //         socket.emit('command', options.port, 'gcode', zProbeCommand.command)
        // })

        // //Boundary macro
        // controller.on('b1:pressed', function(){
        //     if(r2 & (typeof boundaryMacro != 'undefined'))
        //         socket.emit('command', options.port, 'macro:run', boundaryMacro.id)
        // })

        
        // ==[ JOGGING ]==
        var jogging = false;
        var move_x_axis = 0;
        var move_y_axis = 0;
        var move_z_axis = 0;
            
        controller.on('dpad', function(data) {
            switch(data){
                case 65407:
                    move_x_axis = 1;
                    break;
                case 65535:
                    move_x_axis = 1;
                    move_y_axis = -1;
                    break;
                case 32767:
                    move_y_axis = -1;
                    break;
                case 255:
                    move_y_axis = -1;
                    move_x_axis = -1;
                    break;
                case 127:
                    move_x_axis = -1;
                    break
                case 0:
                    move_y_axis = 1
                    move_x_axis = -1;
                    break;
                case 32512:
                    move_y_axis = 1;
                    break;
                case 65280:
                    move_y_axis = 1;
                    move_x_axis = 1;
                    break;
                default:
                    move_x_axis = 0;
                    move_y_axis = 0;
            }

            if(!jogging){
                jogging = true;
                jog()
            }else{
                stopJog(true);
            }
        });
        
        // controller.on('left:moved', function(data) {
        //     var hysteresis = 0.03;
        //     var y = round((data.x-128)/128, 2)*-1;
        //     var x = round((data.y-128)/128, 2)*-1;

        //     var move = false;

        //     if(Math.abs(x)>hysteresis){
        //         move_x_axis = 1*x;    
        //     }else {
        //         move_x_axis = 0;
        //     }

        //     if (Math.abs(y)>hysteresis){
        //         move_y_axis = 1*y;
        //     }else{
        //         move_y_axis = 0;
        //     }
        
        //     if(!jogging){
        //         jogging = true;
        //         jog()
        //     }

        // });
        
        socket.on('serialport:read', function(data) {
            if(jogging){
                jog();
            }
        });

        function jog() {
            console.log('JOG')
            // Check if Axis Needs Moving
            if (move_x_axis != 0 || move_y_axis != 0) {
                
                var a = 1000; // accelerate mm/s^2
                var max_v = 5000; // mm/min
                
                if(l1)
                    max_v = 15000;
                if(l2)
                    max_v = 2500;
                if(l1&l2)
                    max_v = 500;

                var c  = Math.sqrt( Math.pow( move_x_axis, 2 ) + Math.pow( move_y_axis, 2 ))
                var v  = Math.round( max_v *  c)
                var dt = v/60/(2*a*14) + 0.01
                var s  = dt*v;
                
                var s_x = round(move_x_axis * s/c,2)
                var s_y = round(move_y_axis * s/c,2)

                // Debugging this strange Math
                // console.log('m_x:'+move_x_axis);
                // console.log('m_y:'+move_y_axis);
                // console.log('v:'+v);
                // console.log('dt:'+dt);
                // console.log('s:'+s);
                // console.log('s_x:'+s_x);
                // console.log('s_y:'+s_y);
                

                socket.emit('command', options.port, 'gcode', '$J=G91 X' + s_x + " Y" + s_y + ' F' + v);

            }else if (move_z_axis != 0){
                var v = 500;
                var s = move_z_axis;
                if(l1) {
                    v = 4200;
                    s = move_z_axis * 10
                }
                if(l2) {
                    v = 100;
                    s = move_z_axis * 0.1 
                }
                socket.emit('command', options.port, 'gcode', '$J=G91 Z' + s + ' F'+v);
                
                jogging = true;
            }else{
                stopJog();
            }
        }

        function stopJog(j){
            // console.log('Stop JOG')
            socket.emit('command', options.port, 'gcode', '\x85');
            jogging = j;
        }

        function round (value, decimals) {
          return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
        }

    };
}
