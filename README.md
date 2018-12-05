# cncjs-pendant-rumblepad2
Remote pendant fo cnc-js


I've added
`SUBSYSTEMS=="usb", ATTRS{product}=="Logitech Cordless RumblePad 2", GROUP="plugdev", MODE:="0666"`
to "/etc/udev/rules.d/10-local.rules"