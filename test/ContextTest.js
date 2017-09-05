/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let err;
const should = require('should');
const { clone } = require("../Utilities.js");
const winston = require('winston');

const { ContextData } = require('../ContextData.js');

const context = new ContextData("TestContext");
try {
  // Initialization
  should.exist(context);
  context.items.should.exist;
  context.participants.should.be.empty;
  context.sessions.should.exist;
  context.GetItemNames().should.be.empty;
  
  context.GetItemValues("", ["nonexistingname", "anothermadeupname"]).should.have.eql([undefined,undefined]);
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
  context.SetItemValues("p1", ["a"], [1]).should.have.property("a",1);
  context.GetItemValues("p1", ["a","madeupname"]).should.eql([1,undefined]);
  let items = context.SetItemValues("p1", ["b","c"], [2,3]);
  items.should.have.property("b",2);
  items.should.have.property("c",3);
  context.GetItemValues("p1", ["a","b","c"]).should.eql([1,2,3]);
  
  // now with a context coupon
  context.sessions["c1"] = { items: clone(items) };
  context.SetItemValues("p1", ["a"], [1], "c1").should.have.property("a",1);
  context.GetItemValues("p1", ["a"], "c1").should.eql([1]);
  items = context.SetItemValues("p1", ["b","c"], [20,30], "c1");
  items.should.have.property("b",20);
  items.should.have.property("c",30);
  context.GetItemValues("p1", ["a","b","c"], "c1").should.eql([1,20,30]);
  context.GetItemValues("p1", ["a","b","c"]).should.eql([1,2,3]);


} catch (error1) {
  err = error1;
  console.log(err);
}
