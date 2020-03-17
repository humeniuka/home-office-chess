#!/bin/bash

# start webserver which serves the html, css and js files
cd webserver
nohup python3 webserver.py &> webserver.out &
cd -

# start signalling server which transfers messages between
# two players
cd signalling-server
nohup node index.js &> signalling-server.out &
cd -

cat <<EOF
     Go to 

       http://humeniuk.xyz:8085/chess/index.html?room=chess-room-id

     to start a game.

     `chess-room-id` can be replaced by any string so that different rooms
     can be created for playing. Anyone who knows the link can move the pieces
     and write messages. 
EOF

exit


