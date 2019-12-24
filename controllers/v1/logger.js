var bunyan = require('bunyan')
const name = 'faldax-simplex-backend'

const configs = {
    src: true,
    name,
    streams: []
}

const stream = require('gelf-stream').forBunyan(
    'logs.orderhive.plus',
    12201
)
configs.streams.push({
    type: 'raw',
    stream: stream,
    level: 'info'
})
configs.streams.push({
    type: 'stream',
    stream: process.stderr,
    level: 'error'
})

const logger = bunyan.createLogger(configs)

module.exports = logger
