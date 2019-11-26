const EventEmitter = require('events')
const sse = new EventEmitter()

sse.on('uncaughtException', function(err) {
  console.error(err)
})

module.exports = sse
