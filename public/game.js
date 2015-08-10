var socket = io();
var game_area_size_x = 13;
var game_area_size_y = 13;
var is_loaded = true;
var is_dead = true;
var is_moving = true;
var last_explosion = {X:0, Y:0};
var own_coordinates = {X:0, Y:0};

var audioShoot = new Audio('shoot.wav');
var audioReload = new Audio('reload.wav');
var audioExplosion = new Audio('explosion.wav');
var audioMove = new Audio('move.wav');

var own_id = generateId(); // Random id

// Disable / enable moving
function movingDisEn(toBeDisabled) {
    document.getElementById('moveup').disabled = toBeDisabled;
    document.getElementById('movedown').disabled = toBeDisabled;
    document.getElementById('moveleft').disabled = toBeDisabled;
    document.getElementById('moveright').disabled = toBeDisabled;

    // keyboard moving
    is_moving = toBeDisabled;
}

// Generate random Id
function generateId()
{
    var id = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        id += chars.charAt(Math.floor(Math.random() * chars.length));

    return id;
}

// Draw game map
function drawMap(self, explosion, origin, draw_origin) {
    var mapString = "";
    for(var y = 1; y <= game_area_size_y; y++) {
        for(var x = 1; x <= game_area_size_x; x++) {
            var isSelf = false;
            var isExplo = false;
            var isOrigin = false;

            if(explosion.X == x && explosion.Y == y) {
                if(!is_dead && is_loaded) {
                    mapString += "<font id='mapFont' color=red><a href='#' id='maplink' onclick='shootTo("+x+","+y+"); return false;'>*</a> </font>";
                }
                else if(is_dead) {
                    mapString += "<font id='mapFont' color=red><a href='#' id='maplink' onclick='coordsTo("+x+","+y+"); return false;'>*</a> </font>";
                }
                else {
                    mapString += "<font id='mapFont' color=red>* </font>";
                }
                isExplo = true;
            }
            else if(self.X == x && self.Y == y) {
                mapString += "<font id='mapFont' color=blue>@ </font>";
                isSelf = true;
            }
            else if(draw_origin && (origin.X-1 <= x && origin.X+1 >= x && origin.Y-1 <= y && origin.Y+1 >= y)) {
                if(!is_dead && is_loaded) {
                    mapString += "<font id='mapFont' color=blue><a href='#' id='maplink' onclick='shootTo("+x+","+y+"); return false;'>*</a> </font>";
                }
                else if(is_dead) {
                    mapString += "<font id='mapFont' color=blue><a href='#' id='maplink' onclick='coordsTo("+x+","+y+"); return false;'>*</a> </font>";
                }
                else {
                    mapString += "<font id='mapFont' color=blue>* </font>";
                }
                isOrigin = true;                        
            }

            if(!isSelf && !isExplo && !isOrigin && is_dead) {
                mapString += "<font id='mapFont' color=brown><a href='#' id='maplink' onclick='coordsTo("+x+","+y+"); return false;'>X</a> </font>";
            }
            else if(!isSelf && !isExplo && !isOrigin && is_loaded) {
                mapString += "<font id='mapFont' color=brown><a href='#' id='maplink' onclick='shootTo("+x+","+y+"); return false;'>X</a> </font>";
            }
            else if (!isSelf && !isExplo && !isOrigin && !is_loaded) {
                mapString += "<font id='mapFont' color=brown>X </font>";
            }

        }
        mapString += "<br />";
    }
    map.innerHTML = mapString;
}

// Shooting function
shootTo = function(x, y) {

    if(x > -1 && x <= game_area_size_x && 
       y > -1 && y <= game_area_size_y &&
       !isNaN(x) && !isNaN(y)) {                        

        socket.emit('shoot',{target : {X: x, Y: y}, origin : { X: own_coordinates.X, Y: own_coordinates.Y}, id: own_id });

        is_loaded = false;
        owncoords.innerHTML = "<font color=red>Loading gun!</font>";

        setTimeout(function() {
            is_loaded = true;
            owncoords.innerHTML = "<font color=blue>Gun loaded!</font>";
            drawMap(own_coordinates, last_explosion, {X:0, Y:0}, false);
            // Click!
            audioReload.play();
        },2000);

    }
    else {
        infobox.innerHTML = "Give proper coordinates 0-"+(game_area_size_x-1)+" x 0-"+(game_area_size_y-1);
    }


}

// Movement function
coordsTo = function(x, y) {   

    if(x > -1 && x <= game_area_size_x && 
       y > -1 && y <= game_area_size_y &&
       !isNaN(x) && !isNaN(y)) {

            // Wroom!
            audioMove.play();

            // Keep coordinates within borders
            if(x < 1) x = 1;
            if(y < 1) y = 1;
            if(x > game_area_size_x) x = game_area_size_x;
            if(y > game_area_size_y) y = game_area_size_y;

            // Set new coordinates
            own_coordinates.X = x;
            own_coordinates.Y = y;

            // Set not dead because function is used when setting up a new position after destruction
            is_dead = false;
        
            drawMap(own_coordinates, last_explosion, {X:0, Y:0}, false);

            owncoords.innerHTML = "Coordinates set to " + own_coordinates.X + " x " + own_coordinates.Y + "<br />Start shooting by clicking on map or giving coordinates on form.";

            // Disable moving for a while
            movingDisEn(true);
        
            owncoords.innerHTML = "<font color=red>Moving!</font>";
            setTimeout(function() {
                // Enable moving
                movingDisEn(false);
                owncoords.innerHTML = "<font color=blue>Moving finished!</font>";
            },2000);

    }
    else {
        owncoords.innerHTML = "Give proper coordinates 0-"+(game_area_size_x-1)+" x 0-"+(game_area_size_y-1);
    }
}


window.onload = function() {

    chatbox.innerHTML = chatbox.innerHTML + "Chat area...<br />"

    // Listen messages from server
    socket.on('connected', function(data) {
        // Disable moving
        movingDisEn(true);
        
        // Draw map
        drawMap(own_coordinates, last_explosion, {X:0, Y:0}, false);
    });

    //
    // Socket functions
    //

    socket.on('someoneshot', function(data) {

        // Boom!
        audioShoot.play();

        // Save last explosion
        last_explosion = data.target;

        // Someone shot to player's coordinates
        if(data.target.X == own_coordinates.X && data.target.Y == own_coordinates.Y) {

            is_dead = true;

            socket.emit('dead', own_coordinates);

            own_coordinates.X = 0;
            own_coordinates.Y = 0;

            owncoords.innerHTML = "You were hit! <br />Set new coordinates (0-"+(game_area_size_x-1)+") x (0-"+(game_area_size_y-1)+") to play again.";
        }
        else {
            infobox.innerHTML = "Someone shot to " + data.target.X + " x " + data.target.Y;
        }

        // Show approximate of origin (randomized by server) if data.id is not own_id
        drawMap(own_coordinates, data.target, data.origin, (data.id != own_id));
    });

    socket.on('dead', function(data) {
        audioExplosion.play();
        infobox.innerHTML = "<font color=purple>Someone exploded at " + data.X + " x " + data.Y + "</font>";                
    });

    socket.on('gamedata', function(data) {
        gamedata.innerHTML = "Users online: " + data.userAmount;
    });

    socket.on('chatmessage', function(data) {
        chatbox.innerHTML = chatbox.innerHTML + data.sender + ": " + data.message + "<br />";
    });

    //
    // Local input functions
    //

    // Chat message send or enter pressed
    sendChatMessage.onclick = function () {
        //console.log("chatmsg");
        chatMessage.value = chatMessage.value.replace(/<\/?[^>]+(>|$)/g, "");
        if(chatMessage.value.length > 0) {
            var senderName = "";
            chatName.value = chatName.value.replace(/<\/?[^>]+(>|$)/g, "");
            if(chatName.value.length == 0) {
                senderName = "unnamed";
            }
            else {
                senderName = chatName.value;
            }
            socket.emit('chatmessage', {sender: senderName, message: chatMessage.value});
            chatMessage.value = "";
       }
    }

    // Keyboard movement buttons (arrows)
    
    document.onkeydown = function(e) {
    /*
    e.keyCode == 87 up w
    e.keyCode == 83 down s 
    e.keyCode == 65 left a
    e.keyCode == 68 rigth d
    // disabled because of chat
    */
        if(e.keyCode == 38 && is_moving == false && is_dead == false) {
            own_coordinates.Y = own_coordinates.Y-1;
            coordsTo(own_coordinates.X, own_coordinates.Y);
        }
        else if(e.keyCode == 40 && is_moving == false && is_dead == false) {
            own_coordinates.Y = own_coordinates.Y+1;
            coordsTo(own_coordinates.X, own_coordinates.Y);
        }
        else if(e.keyCode == 37 && is_moving == false && is_dead == false) {
            own_coordinates.X = own_coordinates.X-1;
            coordsTo(own_coordinates.X, own_coordinates.Y);
        }
        else if(e.keyCode == 39 && is_moving == false && is_dead == false) {
            own_coordinates.X = own_coordinates.X+1;
            coordsTo(own_coordinates.X, own_coordinates.Y);
        }
    }

    // Movement buttons (on web form)
    
    moveup.onclick = function () {
        own_coordinates.Y = own_coordinates.Y-1;
        coordsTo(own_coordinates.X, own_coordinates.Y);
    }
    movedown.onclick = function () {
        own_coordinates.Y = own_coordinates.Y+1;
        coordsTo(own_coordinates.X, own_coordinates.Y);
    }
    moveleft.onclick = function () {
        own_coordinates.X = own_coordinates.X-1;
        coordsTo(own_coordinates.X, own_coordinates.Y);
    }
    moveright.onclick = function () {
        own_coordinates.X = own_coordinates.X+1;
        coordsTo(own_coordinates.X, own_coordinates.Y);
    }
}