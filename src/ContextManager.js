/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { clone } = require("./Utilities.js");
const events = require('events');
const Q = require('q');
const logger = require('winston');
const _ = require('lodash');
const uuid = require('node-uuid');

const { ContextParticipant } = require("./ContextParticipant.js");
const { ContextParticipantProxy } = require("./ContextParticipant.js");


//
// The ContextManager (CM) is used to control the overall flow of context changes.
//
export default class ContextManager extends events.EventEmitter {

  // Constructor saves *context* which this CM is responsible for and optionally a *notifier* which is expected to be a function which will be invoked when there are notifications. This is expected to be used in e.g. a websocket notifier.
  constructor(context, notifier) {
    super();
    this.context = context;
    this.notifier = notifier;
  }


  // A "dispatcher" which can invoke methods and map arguments.
  InvokeAndMapArguments(method, args) {
    switch (method) {
      case "JoinCommonContext": return this.joinCommonContext(args.applicationName, args.contextParticipant);
      case "LeaveCommonContext": return this.leaveCommonContext(args.participantCoupon);
      case "StartContextChanges": return this.startContextChanges(args.participantCoupon);
      case "EndContextChanges": return this.endContextChanges(args.contextCoupon);
      case "PublishChangesDecision": return this.publishChangesDecision(args.contextCoupon, args.decision);
      case "GetMostRecentContextCoupon": return this.getMostRecentContextCoupon();
      default: throw { msg: `No such method '${method}' on ContextManager` };
    }
  }

  /*

   */
  joinCommonContext(applicationName, contextParticipant) {
    logger.info(`app name = ${applicationName}`);
    if ((applicationName == null)) { throw { type: "MissingArg", msg: "'applicationName' is mandatory for JoinCommonContext"}; }

    logger.info("creating participant");

    // create participant
    let participant =
      (contextParticipant != null) ? new ContextParticipantProxy(uuid.v4(), applicationName, contextParticipant) : new ContextParticipant(uuid.v4(), applicationName);

    // if the participant is already present use the saved participant
    const participantInContext = _.find(this.context.participants, p => (p.applicationName === participant.applicationName) && (p.url === participant.url));
    if ((participantInContext == null)) {
      // save participant in context
      this.context.participants.push(participant);
    } else {
      // participant was already present, use existing
      participant = participantInContext;
    }

    logger.info(`returning coupon = ${participant.coupon}`);
    // return participant coupon
    return participant.coupon;
  }


  leaveCommonContext(participantCoupon) {
    if ((participantCoupon == null)) { throw { type: "MissingArg", msg: "'participantCoupon' is mandatory for LeaveCommonContext"}; }
    this.context.participants = _.reject(this.context.participants, p => p.coupon === participantCoupon);
    return logger.info(`${participantCoupon} left context, current participants are now: ${_.pluck(this.context.participants, "coupon")}`);
  }

  startContextChanges(participantCoupon) {
    const contextCoupon = uuid.v4();
    const context = {
      items: clone(this.context.items),
      active: true,
      coupon: contextCoupon,
      owner: participantCoupon
    };

    this.context.sessions[contextCoupon] = context;
    return contextCoupon;
  }

  endContextChanges(contextCoupon) {
    if ((this.context.sessions[contextCoupon] == null)) {
      throw new ({ status: 501, msg: `No such context ${contextCoupon}`});
    }

    this.context.sessions[contextCoupon].active = false;

    logger.debug(this.notifier);

    // invoke builtin notifier
    if (typeof this.notifier === 'function') {
      this.notifier({
      target: {
        interface: "ContextParticipant",
        method: "ContextChangesPending"
      },
      args: {
        contextCoupon
      }
    });
    }

    // call ContextChangesPending on all ContextParticipants

    const responses = this.context.participants.filter(function(participant) {
      participant.coupon !== (this.context.sessions[contextCoupon] != null ? this.context.sessions[contextCoupon].owner : undefined)
    }).map((participant) => participant.ContextChangesPending(contextCoupon));

    const defer = Q.defer();

    if (responses.length > 0) {
      Q.allResolved(responses)
      .then(
        function(promises) {
          const result = {
            noContinue: false,
            responses: (Array.from(promises).map((promise) => ((promise.valueOf != null) ? promise.valueOf() : promise)))
          };
          return defer.resolve(result);
      });
    } else {
      // resolve w no responses
      defer.resolve({ noContinue: false, responses: []});
    }

    return defer.promise;
  }

  publishChangesDecision(contextCoupon, decision) {
    const context = this.context.sessions[contextCoupon];
    delete this.context.sessions[contextCoupon];

    const accepted = (decision != null ? decision.toLowerCase() : undefined) === "accept";

    // commit actions
    // save latest context coupon
    this.context.latestContextCoupon = contextCoupon;
    // copy items to base context
    this.context.items = context.items;

    // invoke builtin notifier
    if (typeof this.notifier === 'function') {
      this.notifier({
      target: {
        interface: "ContextParticipant",
        method: accepted ? "ContextChangesAccepted" : "ContextChangesCancelled"
      },
      args: {
        contextCoupon: contextCoupon || ""
      }
    });
    }
    // call ContextChangesAccepted/Cancelled on all ContextParticipants
    for (let participant of Array.from(this.context.participants)) { if (participant.coupon !== (context != null ? context.owner : undefined)) { if (accepted) { participant.ContextChangesAccepted(contextCoupon || ""); } else { participant.ContextChangesCancelled(contextCoupon || ""); } } }
  }

  getMostRecentContextCoupon() { return this.context.latestContextCoupon; }
}
