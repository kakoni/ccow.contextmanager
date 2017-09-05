# CCOW ContextManager

This project is fork from original [CCOW](jonathanbp/ccow.contextmanager), coffeescript has been decaffinated into ES6. 

---

This is an implementation in nodejs of a few of the interfaces in the [HL7 CCOW](http://en.wikipedia.org/wiki/CCOW) specification. Its purpose is to provide a functioning (and simple) ContextManager. 

**NB:** Current status is a very rough implementation - not suitable for production.

Currently the ContextManager manages a single context and the following kind of flow is supported (CP is ContextParticipant and CM is ContextManager):


    CP ==>    JoinCommonContext(applicationName,<contextParticipant>)     ==> CM
    CP <--    OK, participantCoupon                                       <-- CM
    CP ==>    StartContextChanges(participantCoupon)                      ==> CM
    CP <--    OK, contextCoupon                                           <-- CM
    CP ==>    SetItemValues(itemNames, itemValues, contextCoupon)         ==> CM

              ...
    
    CP ==>    EndContextChanges(contextCoupon)                            ==> CM
    CP <--    noContinue, responses                                       <-- CM
    CP ==>    PublishChangesDecision(contextCoupon,decision)              ==> CM
    CP <--    listenerUrls (web-application case)                         <-- CM

              ContextChangesAccepted (CM ==> all other CPs)
   
              ...

    CP ==>    LeaveCommonContext(participantCoupon)                       ==> CM
    CP <--    OK                                                          <-- CM

## Run

Use the `npm run start` command which starts a server on port 3000. 

    $ npm run start


## Changelog

### 0.0.10

 * First ES6 release.


## Status

Current status is a basic implementation of ContextManager, ContextParticipant and ContextData interface.

## License

The MIT License (MIT)

Copyright (c) 2012, 2017 Jonathan Bunde-Pedersen, Karri Niemelä

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
