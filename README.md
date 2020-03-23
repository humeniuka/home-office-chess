# Home-Office Chess
You can't play chess with your colleagues at work anymore because of the corona virus lock-down? "Work" from home!

Home-Office Chess is a web application for video chatting and playing chess or Go online.

Requirements:
=============
+ Node.js
+ __STUN__ server for establishing WebRTC connection from
  http://www.stunprotocol.org/stun
+ __chessboardjs__ (from http://chessboardjs.com). You don't have to download this package since it is already contained in `./webserver/public/games/chessboardjs`
+ __jQuery__ . A current copy is included in `./webserver/public/games/jquery.js`.

Manual Installation:
=====================

Installation of STUN server:
----------------------------
 1. Download the STUN server package from http://www.stunprotocol.org/stun and save the package
 in the same folder, where this README file is located, and extract it to the subfolder
 `./stunserver/` with:

 ```bash
  wget http://www.stunprotocol.org/stunserver-1.2.15.tgz
	tar -xvf stunserver-1.2.15.tgz
	rm -f stunserver-1.2.15.tgz
  ```

 2. Since STUNTMAN uses the boost library you might have to install this package as well:

 ```bash
 sudo apt-get install libboost-dev
 ```

 3. Now compile the STUNTMAN package:
 ```bash
 make -C stunserver
 ```

SSL Certificate:
----------------
 4. All servers encrypt their communication. Browsers will reject to connect to the servers unless you have
 a valid SSL certificate (You can get one for free from https://letsencrypt.org/). You have to provide the path
 to the directory containing the certificate (`fullchain.pem`) and private key (`privkey.pem`) by opening the file `control_servers.sh` and changing
 the variable `keyDir`:

 ```bash
 # directory with private key and certificate                      
 keyDir="/etc/letsencrypt/live/your-host-name/"
 ```

Running the application:
------------------------
 5. The home-office-chess application requires three servers to run

   + a STUN server for establishing the real time peer-to-peer communication channel (WebRTC),
   + a signaling server that channels messages back and forth between browsers
   + and a webserver that servers static pages.

   The servers are started and stopped with the help of a shell script that can also be added as
   a service to `/etc/init/` to start the application automatically when the operating system reboots:

 ```
 ./control_servers.sh  [start|stop|restart|status]
 ```

   The error messages produces by the servers can be found in the folder `./run/`.

 6. After successfully starting the servers you should be able to start a chess game by opening

   https://your-host-name:8085/games/play.html?room=my-room-name&game=chess

   `my-room-id` can be replaced by any other string that identifies the game session. Anyone who knows this link
   can move the pieces on the board and chat with you. If you wish to play Go instead of chess, just change `game=chess`
   to `game=go` in the URL.
   Of course, before sending the link to others you should replace `your-host-name` with the hostname of your machine
   for which the SSL certificate has been issued.


