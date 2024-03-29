import { Server } from 'socket.io'

const io = new Server(
  {
    cors: {
      origin: 'https://star-homka.netlify.app',
      methods: ['GET', 'POST']
    }
  }
)

enum Team {
  RED = 'red',
  BLUE = 'blue'
}

interface Player {
  rotation: number,
  x: number,
  y: number,
  playerId: string,
  team: Team
}

interface Players {
  [socketId: string]: Player
}

const players: Players = {}

const star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50,
  lastCollected: 0
}

const scores = {
  blue: 0,
  red: 0
}

io.on('connection', socket => {
  console.log('user connected')

  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: Date.now() % 2 ? Team.RED : Team.BLUE
  }
  // send the "players" object to the new player
  socket.emit('currentPlayers', players)
  // send the star object to the new player
  socket.emit('starLocation', star)
  // send the current scores
  socket.emit('scoreUpdate', scores)
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id])

  socket.on('disconnect', () => {
    console.log('user disconnected')
    // remove this player from our players object
    delete players[socket.id]
    // emit a message to all players to remove this player
    io.emit('disconnected', socket.id)
  })

  // when a player moves, update the player data
  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x
    players[socket.id].y = movementData.y
    players[socket.id].rotation = movementData.rotation
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id])
  })

  socket.on('starCollected', () => {
    // event triggered multiple times for some reason
    if (Date.now() - star.lastCollected < 500) return
    star.lastCollected = Date.now()

    if (players[socket.id].team === Team.RED) {
      scores.red += 10
    } else {
      scores.blue += 10
    }
    star.x = Math.floor(Math.random() * 700) + 50
    star.y = Math.floor(Math.random() * 500) + 50
    io.emit('starLocation', star)
    io.emit('scoreUpdate', scores)
  })

})

io.listen(3000)

