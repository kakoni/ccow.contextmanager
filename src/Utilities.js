/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import _ from 'lodash';

// basic utilities
export const clone = function(obj) {
  if ((obj == null) || (typeof obj !== 'object')) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof RegExp) {
    let flags = '';
    if (obj.global != null) { flags += 'g'; }
    if (obj.ignoreCase != null) { flags += 'i'; }
    if (obj.multiline != null) { flags += 'm'; }
    if (obj.sticky != null) { flags += 'y'; }
    return new RegExp(obj.source, flags);
  }

  const newInstance = new obj.constructor();

  for (let key in obj) {
    newInstance[key] = clone(obj[key]);
  }

  return newInstance;
};

// super class for all datatypes
class Format {

  parseHAP(hap) { return hap.split("^"); }
  generateHAP(hap) { return hap.join("^"); }
  parseList(list) { return list.split("|"); }
  generateList(list) { return list.join("|"); }
  parseObject(obj) {
    // if it is a basic type simply return
    if ((obj.indexOf("^") + obj.indexOf("|") + obj.indexOf("&")) < 0) { return obj; }
    // if compound object, i.e. key1=value1&key2=value2 ...
    if (obj.indexOf("&") > 0) {
      const kvs = obj.split("&") || [];
      return _.reduce(
        kvs,
        ((memo, kv) => {
          const [key, value] = Array.from(kv.split("="));
          memo[key] = this.parseObject(value);
          return memo;
        }
        ),
        {}
      );
    // if piped list, e.g. a|b|c
    } else if (obj.indexOf("|") > 0) {
      return this.parseList(obj);
    // if hatted, e.g. a^b^b
    } else {
      return this.parseHAP(obj);
    }
  }

  generateObject(obj) {
    // primitive type then to string
    if (typeof obj !== "object") { return (obj != null ? obj.toString() : undefined); }
    if (obj instanceof Array) {
      return this.generateList(obj);
    } else {
      return _.reduce(
        obj,
        ((memo, value, key) => {
          memo.push(`${key}=${this.generateObject(value)}`);
          return memo;
        }
        ),
        []
      ).join("&");
    }
  }

  serialize() {}
}


// CX
class CX extends Format {

  constructor(hap) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    [
      this.id,
      this.checkdigit,
      this.checkdigitscheme,
      this.assigningauthority,
      this.identifiertypecode,
      this.assigningfacility,
      this.effectivedate,
      this.expirationdate
    ] = Array.from(this.parseHAP(hap));
  }

  serialize() {
    return this.generateHAP([
      this.id,
      this.checkdigit,
      this.checkdigitscheme,
      this.assigningauthority,
      this.identifiertypecode,
      this.assigningfacility,
      this.effectivedate,
      this.expirationdate
    ]);
  }
}

const reply = formatter =>
  function(req, res, data) {
    if ((data != null ? data.status : undefined) != null) { res.status(data.status); }
    if (req.accepts("json") != null) {
      return res.json(data);
    } else {
      return res.send(formatter.generateObject(data));
    }
  }
;

export const formatter = new Format();

module.exports = {
  formatter,
  reply: reply(formatter),
  clone
};
