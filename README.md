# a320-webpanels
Flightgear A320 Webpanels

This project implements lights, brakes, fcu and engine webpanels for A320.

Installation
------------
Copy the files in Webpanel to <Download Location>\Aircraft\org.flightgear.fgaddon.stable_2020\Aircraft\A320-family\WebPanel

Usage
-----
1. Add "--httpd=8080" in the additional setting when starting up the simulation
2. Use your browser to browse the following addresses
http://<your ip address>:8080/aircraft-dir/WebPanel/fcu.html
http://<your ip address>:8080/aircraft-dir/WebPanel/brakes.html
http://<your ip address>:8080/aircraft-dir/WebPanel/engines.html
http://<your ip address>:8080/aircraft-dir/WebPanel/lights.html

Todo
----
1. Add captain efis panel, overhead panels
2. Implement rotating knobs

Known Issues
------------
1. ANNT LT TEST haven't implemented.
2. Knob, button sometimes are not responsive

Library being used
------------------
- fontawesome 6.2 

