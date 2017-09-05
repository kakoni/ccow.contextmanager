/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const should = require('should');
const { clone } = require("../Utilities.js");

const { ContextData } = require('../ContextData.js');
const { ContextManager } = require('../ContextManager.js');

describe('ContextManager', () =>
  it('should workd', function(done) { 

    const context = new ContextData("TestContext");
    const cm = new ContextManager(context);
    
    cm.should.exist;
    
    
    
    const participantCoupon = cm.JoinCommonContext("test");
    // verify that participant is properly added to context
    should.exist(participantCoupon);
    context.participants.should.have.length(1);
    context.participants[0].should.have.property("coupon",participantCoupon);
    const contextCoupon = cm.StartContextChanges(participantCoupon);
    should.exist(contextCoupon);
    context.SetItemValues(participantCoupon, ["a","b"], [1, 2], contextCoupon);
    
    cm.EndContextChanges(contextCoupon)
    .then(
      function(result) {
        result.responses.should.be.empty;
        return done();
    });
    
    cm.PublishChangesDecision(contextCoupon, "accept");
    context.GetItemValues(participantCoupon, ["a","b"]).should.eql([1,2]);
    cm.LeaveCommonContext(participantCoupon);
    return context.participants.should.have.length(0);
  })
);

