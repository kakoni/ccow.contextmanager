let err;
import should from 'should';
import { clone } from '../src/Utilities';
import winston from 'winston';

import ContextData from '../src/ContextData';

const context = new ContextData("TestContext");

try {
  // Initialization
  should.exist(context);
  context.items.should.exist;
  context.participants.should.be.empty;
  context.sessions.should.exist;
  context.getItemNames().should.be.empty;

  context.getItemValues("", ["nonexistingname", "anothermadeupname"]).should.have.eql([undefined,undefined]);
  try {
    context.SetItemValues("idontexist", ["a"], [1]);
    should.fail;
  } catch (error) {
    err = error;
    winston.error((err != null ? err.msg : undefined) || err);
    should.not.fail;
  }

  // add participant
  context.participants.push({coupon:"p1"});
  context.setItemValues("p1", ["a"], [1]).should.have.property("a",1);
  context.getItemValues("p1", ["a","madeupname"]).should.eql([1,undefined]);
  let items = context.setItemValues("p1", ["b","c"], [2,3]);
  items.should.have.property("b",2);
  items.should.have.property("c",3);
  context.getItemValues("p1", ["a","b","c"]).should.eql([1,2,3]);

  // now with a context coupon
  context.sessions["c1"] = { items: clone(items) };
  context.setItemValues("p1", ["a"], [1], "c1").should.have.property("a",1);
  context.getItemValues("p1", ["a"], "c1").should.eql([1]);
  items = context.setItemValues("p1", ["b","c"], [20,30], "c1");
  items.should.have.property("b",20);
  items.should.have.property("c",30);
  context.getItemValues("p1", ["a","b","c"], "c1").should.eql([1,20,30]);
  context.getItemValues("p1", ["a","b","c"]).should.eql([1,2,3]);


} catch (error1) {
  err = error1;
  console.log(err);
}
