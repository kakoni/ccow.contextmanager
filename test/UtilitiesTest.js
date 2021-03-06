import should from 'should'
import Q from 'q'
import { formatter as f} from '../src/Utilities';

should.exist(f);

const obj = { a: 1, b: "two", c: true, d: [10,20,30]};
const sobj = f.generateObject(obj);
const obj2 = f.parseObject(sobj);

obj2.should.have.property("a",obj.a.toString());
obj2.should.have.property("b",obj.b.toString());
obj2.should.have.property("c");
obj2.d.should.have.length(3);
for (let i = 0; i <= 2; i++) {
  (i => obj2.d[i].should.eql(obj.d[i].toString()))(i);
}



const delay = function(ms) {
    const deferred = Q.defer();
    setTimeout((()=> deferred.resolve("done")), ms);
    return deferred.promise;
};


Q.all(delay(2000)).then(console.log);
