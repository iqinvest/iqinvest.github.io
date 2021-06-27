pragma solidity ^0.6.8;

import "remix_tests.sol";
import "./Math.sol";
import "./MathProxy.sol";


contract Math2_test {
    using Math for uint256;

    MathProxy private proxy;

    function beforeAll() public {
        proxy = new MathProxy();
    }

    function sqrt() public {
        bytes memory payload = abi.encodeWithSignature("sqrt(uint256)", 2555);
        (bool success, bytes memory data) = address(proxy).call(payload);
        Assert.ok(success, "2555^0.5");
        uint256 result = abi.decode(data, (uint256));
        Assert.equal(result, 50, "2555^0.5");

        Assert.equal(Math.sqrt(0), 0, "0^0.5");
        Assert.equal(Math.sqrt(1), 1, "1^0.5");
        Assert.equal(Math.sqrt(2), 1, "2^0.5");
        Assert.equal(Math.sqrt(3), 1, "3^0.5");
        Assert.equal(Math.sqrt(4), 2, "4^0.5");
        Assert.equal(Math.sqrt(5), 2, "5^0.5");
        Assert.equal(Math.sqrt(2452434345553), 1566025, "2452434345553^0.5");
        Assert.equal(Math.sqrt(2**200), 1267650600228229401496703205376, "2**200^0.5");
        uint256 a = 2**256 - 1;
        Assert.equal(a.sqrt(), 340282366920938463463374607431768211455, "(2**256 - 1)^0.5");
        a = 2**256 - 200;
        Assert.equal(a.sqrt(), 340282366920938463463374607431768211455, "(2**256 - 200)^0.5");
        a = 115792089237316195423570985008687907852589419931798687112530834793049593217026;
        Assert.equal(a.sqrt(), 340282366920938463463374607431768211455, "115792089237316195423570985008687907852589419931798687112530834793049593217026^0.5");
        a = 115792089237316195423570985008687907852589419931798687112530834793049593217025;
        Assert.equal(a.sqrt(), 340282366920938463463374607431768211455, "115792089237316195423570985008687907852589419931798687112530834793049593217025^0.5");
        a = 115792089237316195423570985008687907852589419931798687112530834793049593217024;
        Assert.equal(a.sqrt(), 340282366920938463463374607431768211454, "115792089237316195423570985008687907852589419931798687112530834793049593217024^0.5");
        a = 2**254;
        Assert.equal(a.sqrt(), 170141183460469231731687303715884105728, "(2**254)^0.5");
        a = 900;
        Assert.equal(a.sqrt(), 30, "900^0.5");
        a = 1 << 255;
        Assert.equal(a.sqrt(), 240615969168004511545033772477625056927, "(1 << 255)^0.5");
        a = 2**254;
        Assert.equal(a.sqrt(), 170141183460469231731687303715884105728, "(2**254)^0.5");
        a = 170141183460469231731687303715884105728;
        Assert.equal(a.sqrt(), 13043817825332782212, "170141183460469231731687303715884105728^0.5");
    }
}
