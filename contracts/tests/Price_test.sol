pragma solidity ^0.6.8;

import "remix_tests.sol";
import "./Price.sol";


contract Price_test {
    Price private price;

    function beforeAll() public {
        price = new Price();
    }

    function s() public {
        uint256 result = price.s(4500000000000000000000000, 5000000000000000000000000);
        Assert.equal(result, 25000000000000000000000, "4.5M, 5M");

        result = price.s(0, 500000000000000000000000);
        Assert.equal(result, 475000000000000000000000, "0, 0.5M");

        result = price.s(2000000000000000000000000, 2200000000000000000000000);
        Assert.equal(result, 116000000000000000000000, "2M, 2.2M");

        result = price.s(0, 0);
        Assert.equal(result, 0, "0, 0");

        result = price.s(0, 1);
        Assert.equal(result, 0, "0, 1");

        result = price.s(4999999999000000000000000, 4999999999000000000000000);
        Assert.equal(result, 0, "4999999.999, 4999999.999");

        result = price.s(4999999999000000000000000, 5000000000000000000000000);
        Assert.equal(result, 100000, "4999999.999, 5M");

        result = price.s(4999999998000000000000000, 4999999999000000000000000);
        Assert.equal(result, 300000, "4999999.998, 4999999.999");

        result = price.s(0, 5000000000000000000000000);
        Assert.equal(result, 2500000000000000000000000, "0, 5M");
    }

    function v() public {
        uint256 v0 = 5000000000000000000000000;
        uint256 s = 100000000000000000000000;
        bytes memory payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0, true, s);
        (bool success, bytes memory data) = address(price).call(payload);
        Assert.ok(success, "5M, r, 100000eth");
        uint256 result = abi.decode(data, (uint256));
        Assert.equal(result, 4000000000000000000000000, "5M, r, 100000eth");

        result = price.v(4000000000000000000000000, false, s);
        Assert.equal(result, 5000000000000000000000000, "4M, l, 100000eth");

        v0 = 4500000000000000000000000;
        s = 25000000000000000000000;
        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0 + 1, false, s);
        (success,) = address(price).call(payload);
        Assert.ok(!success, "4.5M + 1, l, 25000eth");

        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0, false, s + 1);
        (success,) = address(price).call(payload);
        Assert.ok(!success, "4.5M, l, 25000eth + 1");

        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0, false, s);
        (success, data) = address(price).call(payload);
        Assert.ok(success, "4.5M, l, 25000eth");
        result = abi.decode(data, (uint256));
        Assert.equal(result, 5000000000000000000000000, "4.5M, l, 25000eth");

        result = price.v(5000000000000000000000000, true, 25000000000000000000000);
        Assert.equal(result, 4500000000000000000000000, "5M, r, 25000eth");

        v0 = 500000000000000000000000;
        s = 475000000000000000000000;
        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0 - 2, true, s);
        (success,) = address(price).call(payload);
        Assert.ok(!success, "0.5M - 2, r, 475000eth");

        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0, true, s + 2);
        (success,) = address(price).call(payload);
        Assert.ok(!success, "0.5M, r, 475000eth + 2");

        payload = abi.encodeWithSignature("v(uint256,bool,uint256)", v0, true, s);
        (success, data) = address(price).call(payload);
        Assert.ok(success, "0.5M, r, 475000eth");
        result = abi.decode(data, (uint256));
        Assert.equal(result, 0, "0.5M, r, 475000eth");

        result = price.v(0, false, s);
        Assert.equal(result, 500000000000000000000000, "0, l, 475000eth");

        result = price.v(2200000000000000000000000, true, 116000000000000000000000);
        Assert.equal(result, 2000000000000000000000000, "2.2M, r, 116000eth");

        result = price.v(2000000000000000000000000, false, 116000000000000000000000);
        Assert.equal(result, 2200000000000000000000000, "2M, l, 116000eth");

        result = price.v(0, true, 0);
        Assert.equal(result, 0, "0, r, 0eth");

        result = price.v(0, false, 0);
        Assert.equal(result, 0, "0, l, 0eth");

        v0 = 5000000000000000000000000;
        result = price.v(v0, false, 0);
        Assert.equal(result, v0, "5M, l, 0eth");

        result = price.v(v0, true, 0);
        Assert.equal(result, v0, "5M, r, 0eth");

        result = price.v(4999999998000000000000000, false, 300000);
        Assert.equal(result, 4999999999000000000000000, "4999999.998, l, 300000");

        result = price.v(4999999999000000000000000, true, 300000);
        Assert.equal(result, 4999999998000000000000000, "4999999.999, r, 300000");

        result = price.v(0, false, 2500000000000000000000000);
        Assert.equal(result, 5000000000000000000000000, "0, l, 2500000eth");

        result = price.v(5000000000000000000000000, true, 2500000000000000000000000);
        Assert.equal(result, 0, "5000000, r, 2500000eth");
    }
}
