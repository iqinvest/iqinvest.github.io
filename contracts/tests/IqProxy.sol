pragma solidity ^0.4.26;


interface IqInterface {
    function transfer(address _to, uint256 _value) external returns (bool);

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);

    function approve(address _spender, uint256 _value) external returns (bool);

    function mint(address _to, uint256 _value) external;

    function burn(address _from, uint256 _value) external;

    function setOwner(address _owner) external;

    function kill() external;

    function decentralize() external;

    function clean(address _contract, uint256 _value) external;

    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256);

    function allowance(address _owner, address _spender) external view returns (uint256);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function owner() external view returns (address);

    function decentralized() external view returns (bool);
}


contract IqProxy {
    IqInterface private iq;

    constructor(address _iq) public payable {
        iq = IqInterface(_iq);
    }

    function transfer(address _to, uint256 _value) external {
        require(iq.transfer(_to, _value), "false");
    }

    function transferFrom(address _from, address _to, uint256 _value) external {
        require(iq.transferFrom(_from, _to, _value), "false");
    }

    function approve(address _spender, uint256 _value) external {
        require(iq.approve(_spender, _value), "false");
    }

    function mint(address _to, uint256 _value) external {
        iq.mint(_to, _value);
    }

    function burn(address _from, uint256 _value) external {
        iq.burn(_from, _value);
    }

    function setOwner(address _owner) external {
        iq.setOwner(_owner);
    }

    function kill() external {
        iq.kill();
    }

    function decentralize() external {
        iq.decentralize();
    }

    function clean(address _contract, uint256 _value) external {
        iq.clean(_contract, _value);
    }

    function totalSupply() external view returns (uint256) {
        return iq.totalSupply();
    }

    function balanceOf(address _owner) external view returns (uint256) {
        return iq.balanceOf(_owner);
    }

    function allowance(address _owner, address _spender) external view returns (uint256) {
        return iq.allowance(_owner, _spender);
    }

    function name() external view returns (string memory) {
        return iq.name();
    }

    function symbol() external view returns (string memory) {
        return iq.symbol();
    }

    function decimals() external view returns (uint8) {
        return iq.decimals();
    }

    function owner() external view returns (address) {
        return iq.owner();
    }

    function decentralized() external view returns (bool) {
        return iq.decentralized();
    }

    function thisBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function contractBalance() external view returns (uint256) {
        return address(iq).balance;
    }
}
