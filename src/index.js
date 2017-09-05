#!/usr/bin/env node
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import http from 'http';
import express from 'express';
import SocketIO from 'socket.io';
import _ from 'lodash'

// Q is awesome beyond belief
import Q from 'q';
import Util from './Utilities'
import logger from 'winston';


import ContextData from './ContextData';
import ContextManager from './ContextManager';

let app = express();
let server = http.Server(app);
let io = SocketIO(server);

app.server = http.createServer(app);

const notifier = function(msg) {
  logger.info("emitting ", msg);
  return io.sockets.emit("message", msg);
};

const defaultcontext = new ContextData("default", [], {}, notifier);
defaultcontext.on("updated",()=> logger.debug("UPDATED!"));

const defaultcontextmanager = new ContextManager(defaultcontext, notifier);

const interfaces = {
  contextdata: defaultcontext,
  contextmanager: defaultcontextmanager
};


// Handler for /<interface>/<method> request
app.get('/:interface/:method', function(req, res) {
  const ifc = interfaces[req.params.interface.toLowerCase()];

  logger.info(`Invoking '${req.params.method}' on '${req.params.interface}'`);

  return Q.fcall(() => ifc.InvokeAndMapArguments(req.params.method, req.query))
  .then(result => Util.reply(req, res, result)).fail(function(err) {
      logger.error((err != null ? err.msg : undefined) || err);
      return Util.reply(req, res, err);
  });
});

// Handler for /<interface>?method=<method> requests
app.get('/:interface', function(req, res) {
  const ifc = interfaces[req.params.interface.toLowerCase()];

  if ((ifc == null)) {
    logger.log(`No such interface ${req.params.interface}.`);
    res.status(500).send(`No such interface ${req.params.interface}.`);
    return;
  }


  if ((req.query.method == null)) {
    logger.log("Missing 'method' query param");
    res.status(500).send("Missing 'method' query param");
    return;
  }

  logger.info(`Invoking '${req.query.method} on ${req.params.interface}'`);

  return Q.fcall(() => ifc.InvokeAndMapArguments(req.query.method, req.query))
  .then(result => Util.reply(req, res, result)).fail(function(err) {
      logger.error((err != null ? err.msg : undefined) || err);
      return Util.reply(req, res, err);
  });
});

// Handler for /?interface=<interface>&method=<method> requests
app.get('/', function(req, res) {
  if (!((req.query.method != null) || (req.query.interface != null))) {
    logger.warn("Missing 'method' or 'interface' query param");
    res.status(500).send("Missing 'method' or 'interface' query param");
    return;
  }

  logger.info(`Invoking '${req.query.method} on ${req.query.interface}'`);

  const ifc = interfaces[req.query.interface.toLowerCase()];

  return Q.fcall(() => ifc.InvokeAndMapArguments(req.query.method, req.query))
  .then(result => Util.reply(req, res, result)).fail(function(err) {
      logger.error((err != null ? err.msg : undefined) || err);
      return Util.reply(req, res, err);
  });
});


// Start application
server.listen(3000);
console.log('Listening on port 3000');
