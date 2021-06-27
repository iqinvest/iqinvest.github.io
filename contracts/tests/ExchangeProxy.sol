pragma solidity ^0.6.8;


interface ExchangeInterface {
    function buy(uint256 _tokens) external payable;

    function sell(uint256 _tokens) external;

    function clean(address _contract, uint256 _value) external;
}


contract ExchangeProxy {
    ExchangeInterface private exchange;

    constructor(address _exchange) public payable {
        exchange = ExchangeInterface(_exchange);
    }

    receive() external payable {
    }

    function send(uint256 _wei) external {
        (bool successful, ) = address(exchange).call{value: _wei, gas: 200000}("");
        require(successful, "throw");
    }

    function buy(uint256 _wei, uint256 _tokens) external {
        exchange.buy{value: _wei}(_tokens);
    }

    function sell(uint256 _tokens) external {
        exchange.sell(_tokens);
    }

    function clean(address _contract, uint256 _value) external {
        exchange.clean(_contract, _value);
    }

    function thisBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function exchangeBalance() external view returns (uint256) {
        return address(exchange).balance;
    }
}
