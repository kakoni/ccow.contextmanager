/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const events = require('events');
const logger = require('winston');
const _ = require('lodash');

export default class ContextData extends events.EventEmitter {

  constructor(name, participants = [], items = {}, notifier) {
    super();
    this.name = name;
    this.participants = participants;
    this.items = items;
    this.notifier = notifier;
    this.sessions = {};
  }

  InvokeAndMapArguments(method, args) {
    switch (method) {
      case "GetItemNames": return this.getItemNames(args.contextCoupon);
      case "GetItemValues": return this.getItemValues(args.participantCoupon, args.itemNames.split("|"), args.contextCoupon, ((args.onlyChanges != null ? args.onlyChanges.toLowerCase() : undefined) === 'true'));
      case "SetItemValues": return this.setItemValues(args.participantCoupon, args.itemNames.split("|"), args.itemValues.split("|"), args.contextCoupon);

      default: throw { msg: `No such method '${method}' on Context` };
    }
  }


  getItemNames(contextCoupon) {
    const items = this.sessions[contextCoupon] ? this.sessions[contextCoupon].items : this.items;
    return _.keys(items);
  }

  getItemValues(participantCoupon, itemNames, contextCoupon, onlyChanges) {
    if (onlyChanges) { throw { msg: "'onlyChanges' argument to GetItemValues with value true not currently supported", status: 501 }; }
    const items = this.sessions[contextCoupon] ? this.sessions[contextCoupon].items : this.items;
    // do not remove null values
    return _.map(itemNames, name => items[name]);
  }

  setItemValues(participantCoupon, itemNames, itemValues, contextCoupon) {
    const items = this.sessions[contextCoupon] ? this.sessions[contextCoupon].items : this.items;

    // ensure all required parameters are set
    if (!((itemNames != null) && (itemValues != null) && (participantCoupon != null))) {
      throw { msg: "Required arguments for 'SetItemValues' are 'itemNames','itemValues' and 'participantCoupon'" };
    }

    // check that participant is present in context
    if (!_.any(this.participants,p=> p.coupon === participantCoupon)) {
      throw { msg: `No such participant '${participantCoupon}'`};
    }

    // updated all itemValues referred to in itemNames
    for (let i = 0, end = itemNames.length-1, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) {
      (i => {
        logger.info(`updating ${itemNames[i]} with ${itemValues[i]}`);
        return items[itemNames[i]] = itemValues[i];
      })(i);
    }

    // emit updated event
    this.emit("updated", this, itemNames, itemValues, participantCoupon);

    // notify if contextCoupon isnt set
    if ((contextCoupon == null)) {

      // invoke builtin notifier
      if (typeof this.notifier === 'function') {
        this.notifier({
        target: {
          interface: "ContextParticipant",
          method: "ContextChangesAccepted"
        },
        args: {
          contextCoupon: ""
        }
      });
      }

      // invoke ContextChangesAccepted on all participants
      this.participants.forEach(function(participant) {
        if (participant.coupon !== participantCoupon) {
          participant.ContextChangesAccepted("");
        };
      })
    }

    // return current items
    return items;
  }
}
