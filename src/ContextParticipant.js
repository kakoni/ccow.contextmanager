/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const url = require('url');
const Q = require('q');
const { formatter } = require('./Utilities.js');
const winston = require('winston');

export default class ContextParticipant {

  constructor(coupon,applicationName) {
    this.coupon = coupon;
    this.applicationName = applicationName;
  }

  contextChangesPending(contextCoupon) {
    this.log("ContextChangesPending (accept'ed)");
    // return decision => accept|conditionally_accept, reason (empty if accept)
    return { decision: "accept", reason: "" };
  }

  contextChangesAccepted(contextCoupon) {
    return this.log(`ContextChangesAccepted(${contextCoupon})`);
  }

  contextChangesCancelled(contextCoupon) {
    return this.log(`ContextChangesCancelled(${contextCoupon})`);
  }

  commonContextTerminated() {
    return this.log("CommonContextTerminated");
  }

  ping() {
    this.log("Ping. Pong.");
    return "Pong";
  }

  log(msg) {
    return winston.info(`${this.applicationName} (${this.coupon}) -> ${msg}`);
  }
}

class ContextParticipantProxy extends ContextParticipant {

  constructor(coupon, applicationName, url1, http = require("http")) {
    super(coupon, applicationName);
    this.url = url1;
    this.http = http;
  }

  contextChangesAccepted(contextCoupon) {
    return this.get("ContextChangesAccepted", contextCoupon);
  }

  contextChangesCancelled(contextCoupon) {
    return this.get("ContextChangesCancelled", contextCoupon);
  }

  commonContextTerminated(contextCoupon) {
    return this.get("CommonContextTerminated", contextCoupon);
  }

  // this returns a promise
  contextChangesPending(contextCoupon) {
    return this.get("ContextChangesPending", contextCoupon);
  }

  get(method, contextCoupon) {
    // send request to callback url and return reply
    this.log(`${method}(${contextCoupon}) -- proxying to ${this.url}`);
    const deferred = Q.defer();
    this.http.get(`${this.url}/ContextParticipant/${method}?contextCoupon=${contextCoupon}`, res => {
      let chunks = "";
      res.on("data", chunk => chunks += chunk);
      return res.on("end", () => {
        const response = formatter.parseObject(chunks);
        this.log(`received response '${chunks}' parsed into '${response}'`);
        return deferred.resolve(response);
      });
    }).on("error", e => {
      this.log(`received error ${e}`);
      return deferred.resolve({ decision: "error", reason: `Could not contact '${this.applicationName}' at '${this.url}'.`});
    });

    // return promise
    return deferred.promise;
  }
}

exports.ContextParticipant = ContextParticipant;
exports.ContextParticipantProxy = ContextParticipantProxy;
