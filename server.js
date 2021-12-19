const express = require('express')
const WebSocket = require('ws');

const app = express()

app.set("view engine", 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index')
  })

const port = process.env.PORT || '5000';
const server = app.listen(port, () => console.log(`Server started on Port ${port}`));

// websocket configuration
const webSocket = new WebSocket.Server({ server:server });

let bandMap = new Map();
bandMap.set('piano', null);
bandMap.set('clap', null);
bandMap.set('hihat', null);
bandMap.set('open-hihat', null);
bandMap.set('kick', null);
bandMap.set('snare', null);

webSocket.on('connection', function connection(ws) {
  console.log('A new client Connected!');
  console.log('Total clients connected: ' + webSocket.clients.size)

  for (const [key, value] of bandMap.entries()) {
    if (!value) {
      bandMap.set(key, ws);
      break
    }
  }

  //notify all users when new user connected
  webSocket.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      let map = new Map();
      
      for (const [key, value] of bandMap.entries()) {
        if (!value) {
          map.set(key, '')
        } else
        if (value === client) {
          map.set(key, 'active')
        } else 
        if (value !== client) {
          map.set(key, 'busy')
        }
      }

      const message = {type: 'CONNECTIONS_UPDATED', data: Object.fromEntries(map)}
      client.send(JSON.stringify(message));
    }
  });

  ws.on('message', function incoming(message) {
    console.log('websocket message received: %s', message);

    webSocket.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', function(reasonCode, description) {
    console.log('A client Disconnected!');
    console.log('Total clients connected: ' + webSocket.clients.size)

    for (const [key, value] of bandMap.entries()) {
      let found = false

      webSocket.clients.forEach(function each(client) {
        if (value === client) {
          found = true
        }
      })

      if(!found) {
        bandMap.set(key, null)
      }
    }

    //notify all users when new user disconnected
    webSocket.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        let map = new Map();
        
        for (const [key, value] of bandMap.entries()) {
          if (!value) {
            map.set(key, '')
          } else
          if (value === client) {
            map.set(key, 'active')
          } else 
          if (value !== client) {
            map.set(key, 'busy')
          }
        }
  
        const message = {type: 'CONNECTIONS_UPDATED', data: Object.fromEntries(map)}
        client.send(JSON.stringify(message));
      }
    });
  });
});