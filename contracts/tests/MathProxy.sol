pragma solidity ^0.6.8;

import "./Math.sol";


contract MathProxy {
    using Math for uint256;

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a.add(b);
    }

    function sub(uint256 a, uint256 b) public pure returns (uint256) {
        return a.sub(b);
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256) {
        return a.mul(b);
    }

    function div(uint256 a, uint256 b) public pure returns (uint256) {
        return a.div(b);
    }

    function sqrt(uint256 a) public pure returns (uint256) {
        return a.sqrt();
    }
}
