Manual test.

Deploy Iq.sol.
Deploy several instances of IqProxy.sol with address(Iq) as an argument.
Do some tests.

Deploy Exchange.sol with address(Iq) as an argument.
Deploy ExchangeProxy.sol with address(Exchange) as an argument.
Do some test.


Auto tests.

Run all *_test.sol tests.
Deploy IqTest.sol.
Call init(), then test().
It should not throw exception.
