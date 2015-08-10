//var app = require('express')(); // same as: var express = require('express'); var app = express();
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//
// MIDDLEWARE
//

// Configure jade for this server
app.set('views','./views');
app.set('view engine','jade');

// Sets webroot to 'public' directory
app.use('/', express.static('public'));

app.get('/', function(req,res) {
    //console.log('New connection with ' + req.headers['user-agent']);
    res.render('index');
});

//
// SERVER CODE STARTS HERE
//

var usersConnected = 0;

// Wait for connections
io.on('connection', function(socket) {
    usersConnected++;
    
    //console.log('User connected. Online: ' + usersConnected);
    socket.emit('connected', {message:"You are connected!"});
    io.emit('gamedata', {userAmount: usersConnected});    
    
    socket.on('disconnect', function(data) {
        usersConnected--;
        var dataPack = {userAmount: usersConnected};
        io.emit('gamedata',dataPack);
    });
    
    socket.on('shoot', function(data) {
        // Origin of shot:
        // Server should mix this by random +(-1,0, or +1) to x and y of origin value
        data.origin.X = (data.origin.X + Math.floor((Math.random() * 3) - 1));
        data.origin.Y = (data.origin.Y + Math.floor((Math.random() * 3) - 1));
        io.emit('someoneshot',data);
    });
    
    socket.on('dead', function(data) {
        io.emit('dead',data);
    });
    
    socket.on('chatmessage', function(data) {
        // Clean from special chars in here too JUST in case
        data.sender = data.sender.replace(/<\/?[^>]+(>|$)/g, "");
        data.message = data.message.replace(/<\/?[^>]+(>|$)/g, "");
        io.emit('chatmessage', data); 
    });
    
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

http.listen(server_port, server_ip_address, function() {
    console.log('listening ' + server_ip_address + ' on port ' + server_port);
});