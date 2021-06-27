pragma solidity ^0.6.8;

import "./Math.sol";


// token, 18 decimals
// v, volume, balance of the exchange in tokens, 0 <= v <= 5*10^24
// p, price, wei/token, 0 <= p <= 1
// s, sum, wei, 0 <= s

// p = linearFunction(v), p(0) = 1, p(5*10^24) = 0
// p = 1 - v/5*10^24
contract Price {
    using Math for uint256;

    // v - volume in tokens
    // require vL <= vR <= 5*10^24, check this before!
    // returns sum in wei between vL and vR, rounded to zero
    //
    // s = (vR - vL) * (p(vR) + p(vL))/2
    // s = (vR - vL) * (1 - vR/5*10^24 + 1 - vL/5*10^24)/2
    // s = (vR - vL) * (10^25 - vR - vL) / 10^25
    // can not overflow, max value ~10^50 < 2^170
    function s(uint256 vL, uint256 vR) public pure returns (uint256) {
        return vR.sub(vL).mul(Math.sub(10**25, vR).sub(vL)).div(10**25);
    }

    // v0 - current volume in tokens
    // require v0 <= 5*10^24, check this before!
    // isV0Right - bool, if true, returns v <= v0, else returns v >= v0
    // s - sum in wei
    // returns volume v in tokens, reverts if s is too big
    // 0 <= v <= 5*10^24
    //
    // '+-' - if isV0Right use first sign '+', else use second sign '-'
    // s = +- 0.5*((5*10^24 - v)*p(v)) -+ 0.5*((5*10^24 - v0)*p(v0))
    // +- s*2 = (5*10^24 - v)*(1 - v/5*10^24) - (5*10^24 - v0)*(1 - v0/5*10^24)
    // 5*10^24 - v - v + v^2/5*10^24 - 5*10^24 + v0 + v0 - v0^2/5*10^24 -+ s*2 = 0
    // v^2/5*10^24 - v*2 + (v0*2 - v0^2/5*10^24 -+ s*2) = 0
    // v^2 - v*10^25 + (v0*10^25 - v0^2 -+ s*10^25) = 0
    //
    // discr = b^2 - 4ac = 10^50 - 4*(v0*10^25 - v0^2 -+ s*10^25)
    // d = 10^50 +- s*4*10^25 - (10^25 - v0)*v0*4
    // can be negative or overflow
    //
    // x = (-b +- d^0.5) / 2a
    // v = 5*10^24 - d^0.5/2
    // can not be b + d because 5*10^24 is maximum, can be negative
    function v(uint256 v0, bool isV0Right, uint256 s) public pure returns (uint256) {
        uint256 d = 10**50;
        if (isV0Right) {
            d = d.add(s.mul(4*10**25)).sub(Math.sub(10**25, v0).mul(v0).mul(4));
        } else {
            d = d.sub(s.mul(4*10**25)).sub(Math.sub(10**25, v0).mul(v0).mul(4));
        }
        return Math.sub(5*10**24, d.sqrt().div(2));
    }
}
