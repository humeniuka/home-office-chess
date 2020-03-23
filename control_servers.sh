#!/bin/bash
#
# control online chess server
#
# Usage:
#   control_servers.sh  [start|stop|restart]
#
#

# directory with private key and certificate
keyDir="/etc/letsencrypt/live/humeniuk.xyz"
# port where signaling server listens
portSignal=9000
# port where secure web-server for static pages listens
portWeb=8085
# port where STUN server listens
portSTUN=3478

function start_servers () {
    echo "=== Start Servers: ==="
    # PIDs and output is stored in subfolder ./run
    mkdir -p run

    # start STUN server
    nohup ./stunserver/stunserver --primaryport $portSTUN &> run/stunserver.out &
    echo $! > run/stunserver.pid
    
    # start signaling server which transfers messages between
    # two players
    nohup ./signaling-server/signaling_server.js $keyDir $portSignal &> run/signaling_server.out &
    # save process ID
    echo $! > run/signaling_server.pid
    
    # start webserver which serves the html, css and js files
    nohup ./webserver/webserver.js $keyDir $portWeb &> run/webserver.out &
    # save process ID so that we can later kill the server
    echo $! > run/webserver.pid
    

    cat << EOF
     Go to 

       https://${HOSTNAME}:8085/games/play.html?game=chess&room=home-office

     to start a game.

     'home-office' can be replaced by any string so that different rooms
     can be created for playing. Anyone who knows the link can move the pieces
     and write messages. 
EOF
}


function stop_servers () {
    echo "=== Start Servers: ==="
    # stop all servers
    for server in "webserver" "signaling_server" "stunserver"
    do
	if [ -f run/${server}.pid ]
	then
	    pid=$(cat run/${server}.pid)
	    killByPID $pid $server
	    # remove current PID and output files
	    mv run/${server}.pid run/${server}.pid.LAST
	    mv run/${server}.out run/${server}.out.LAST
	else
	    echo "File run/${server}.pid not found, server has not been started."
	fi
    done
}

function status_servers () {
    echo "=== Status of Servers: ==="
    for server in "webserver" "signaling_server" "stunserver"
    do
	if [ -f run/${server}.pid ]
	then
	    pid=$(cat run/${server}.pid)
	    statusByPID $pid $server
	else
	    echo "File run/${server}.pid not found, server has not been started."
	fi
    done
}

function statusByPID () {
    pid=$1
    name=$2
    # check if PIDs in run/server_nam
    procName=$(ps ax | grep "^\s*$pid "  | grep -v grep | awk '{print $5,$6}')
    if [[ $procName =~ $name ]]
    then
	echo "${name} is running with PID $pid"
    else
	echo "${name} is NOT running with PID $pid, it's probably DOWN, see run/${name}.out"
    fi
}

function killByPID () {
    pid=$1
    name=$2
    # Kill the process with PID if its name matches
    
    # name of the program running with this PID
    procName=$(ps ax | grep "^\s*$pid "  | grep -v grep | awk '{print $5,$6}')
    if [[ $procName =~ $name ]]
    then
	echo "killing $name with PID $pid"
	kill -9 $pid
    fi
}

case "$1" in
    start)
	start_servers
	status_servers
	;;
    stop)
	stop_servers
	;;
    restart)
	stop_servers
	start_servers
	status_servers
	;;
    status)
	status_servers
	;;
    *)
	echo ""
	echo "Usage: $(basename $0) [start|stop|restart|status]"
	echo ""
	echo "   Starts, stops or restarts the servers needed for the online-chess app:"
	echo "     - secure web server          at port $portWeb"
	echo "     - secure signaling server    at port $portSignal"
	echo "     - STUN server                at port $portSTUN"
	echo ""
	exit 1
esac
	
exit 0


