import should from 'should';
import { clone } from '../src/Utilities';
import ContextData from '../src/ContextData';
import ContextManager from '../src/ContextManager';

describe('ContextManager', () =>
  it('should workd', function(done) {

    const context = new ContextData("TestContext");
    const cm = new ContextManager(context);

    cm.should.exist;



    const participantCoupon = cm.joinCommonContext("test");
    // verify that participant is properly added to context
    should.exist(participantCoupon);
    context.participants.should.have.length(1);
    context.participants[0].should.have.property("coupon",participantCoupon);
    const contextCoupon = cm.startContextChanges(participantCoupon);
    should.exist(contextCoupon);
    context.setItemValues(participantCoupon, ["a","b"], [1, 2], contextCoupon);

    cm.endContextChanges(contextCoupon)
    .then(
      function(result) {
        result.responses.should.be.empty;
        return done();
    });

    cm.publishChangesDecision(contextCoupon, "accept");
    context.getItemValues(participantCoupon, ["a","b"]).should.eql([1,2]);
    cm.leaveCommonContext(participantCoupon);
    return context.participants.should.have.length(0);
  })
);
