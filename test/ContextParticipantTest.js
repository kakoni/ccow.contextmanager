/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should');
const { clone } = require("../Utilities.js");
const events = require("events");


const { ContextParticipant } = require('../ContextParticipant.js');
const { ContextParticipantProxy } = require('../ContextParticipant.js');


class TestResource extends events.EventEmitter {

  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.data = this.data.bind(this);
    super(...args);
  }

  data(s, delay) {
    if (delay == null) { delay = 500; }
    return setTimeout(
      () => {
        this.emit("data", s);
        return this.emit("end");
      },
      delay
    );
  }
}


class TestHttp extends events.EventEmitter {

  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.urlsInvoked = [];
  }

  get(url, callback) {

    this.urlsInvoked.push(url);

    const res = new TestResource();

    callback(res);
    res.data("decision=accept&reason=all good");

    // return this
    return this;
  }
}

const cp = new ContextParticipant("coupon#1", "application#1");

describe("ContextParticipant", function() {
  describe("ContextChangesPending", () =>
    it("should return an object w properties decision and reason", function() {
      const result = cp.ContextChangesPending("coupon#3");
      result.should.have.property("decision");
      return result.should.have.property("reason");
    })
  );
  describe("ContextChangesAccepted", () =>
    it("should't do anything interesting", () => cp.ContextChangesAccepted("coupon#3"))
  );
  describe("ContextChangesCancelled", () =>
    it("should't do anything interesting", () => cp.ContextChangesCancelled("coupon#3"))
  );
  return describe("CommonContextTerminated", () =>
    it("should't do anything interesting", () => cp.CommonContextTerminated())
  );
});


// PROXY

describe("ContextParticipantProxy", function() {
  describe("ContextChangesPending", () =>
    it("should GET the correct url", function(done) { 
      const http = new TestHttp();
      const cpp = new ContextParticipantProxy("coupon#2", "application#1", "http://test", http);
      const result = cpp.ContextChangesPending("coupon#3");

      result.then(function(v) { 
        should.exist(v);
        v.should.have.property("decision","accept");
        return done();
      });
      
      http.urlsInvoked.should.have.length(1);
      return http.urlsInvoked.should.match(/ContextParticipant\/ContextChangesPending/);
    })
  );

  describe("ContextChangesAccepted", () =>
    it("should GET the correct url", function(done) { 
      const http = new TestHttp();
      const cpp = new ContextParticipantProxy("coupon#2", "application#1", "http://test", http);

      const result = cpp.ContextChangesAccepted("coupon#3");

      result.then(function(v) { 
        should.exist(v);
        return done();
      });
      
      http.urlsInvoked.should.have.length(1);
      return http.urlsInvoked.should.match(/ContextParticipant\/ContextChangesAccepted/);
    })
  );


  describe("ContextChangesCancelled", () =>
    it("should GET the correct url", function(done) { 
      const http = new TestHttp();
      const cpp = new ContextParticipantProxy("coupon#2", "application#1", "http://test", http);

      const result = cpp.ContextChangesCancelled("coupon#3");

      result.then(function(v) { 
        should.exist(v);
        return done();
      });
      
      http.urlsInvoked.should.have.length(1);
      return http.urlsInvoked.should.match(/ContextParticipant\/ContextChangesCancelled/);
    })
  );
  return describe("CommonContextTerminated", () =>
    it("should GET the correct url", function(done) { 
      const http = new TestHttp();
      const cpp = new ContextParticipantProxy("coupon#2", "application#1", "http://test", http);

      const result = cpp.CommonContextTerminated("coupon#3");

      result.then(function(v) { 
        should.exist(v);
        return done();
      });
      
      http.urlsInvoked.should.have.length(1);
      return http.urlsInvoked.should.match(/ContextParticipant\/CommonContextTerminated/);
    })
  );
});


