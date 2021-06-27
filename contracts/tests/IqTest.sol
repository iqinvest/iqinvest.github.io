pragma solidity ^0.4.26;

import "./iq.sol";
import "./iqProxy.sol";


contract IqTest {
    Iq private iq;
    IqProxy private a;
    IqProxy private b;
    IqProxy private c;

    constructor() public payable {
    }

    function init() public {
        iq = new Iq();
        a = new IqProxy(address(iq));
        b = new IqProxy(address(iq));
        c = new IqProxy(address(iq));
        iq.setOwner(address(a));
    }

    function test() public {
        a.mint(address(b), 1000000000000000000);
        a.mint(address(c), 1000000000000000000);
        a.burn(address(c), 500000000000000000);
        a.decentralize();
        b.approve(address(a), 500000000000000000);
        a.transferFrom(address(b), address(c), 100000000000000000);
        b.transfer(address(c), 100000000000000000);

        require(iq.totalSupply() == 7000001500000000000000000);
        require(iq.decentralized());
        require(iq.allowance(address(b), address(a)) == 400000000000000000);
        require(iq.allowance(address(b), address(c)) == 0);
        require(iq.balanceOf(address(a)) == 0);
        require(a.balanceOf(address(b)) == 800000000000000000);
        require(b.balanceOf(address(c)) == 700000000000000000);
    }
}
