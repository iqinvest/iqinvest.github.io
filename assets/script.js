"use strict";

(function () {
    var pageExchange = 0;
    var pageFaq = 1;
    var pageBounty = 2;
    var pagePartners = 3;
    var networkMain = 1;
    var networkRopsten = 3;
    var tokenAbi = [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "success",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                },
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "_from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "_to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ];
    var exchangeAbi = [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "_buyer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_wei",
                    "type": "uint256"
                }
            ],
            "name": "Buy",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "_seller",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_wei",
                    "type": "uint256"
                }
            ],
            "name": "Sell",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "buy",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_tokens",
                    "type": "uint256"
                }
            ],
            "name": "sell",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    var mainTokenAddress = '0xB9076BB251285aa70E05d38fB1c061474AeFdb7a';
    var mainExchangeAddress = '0x102d766eF1c910CFa3337fC59aCE9E38Aa993e20';
    var ropstenTokenAddress = '0xe7286c430B35CE0ab7539210bD21F528dA5e5670';
    var ropstenExchangeAddress = '0xcEfe405674339E93D8b7E7329Bfaf22D7d7923c9';

    var page = pageExchange;
    var tabBuy = true; // if true, tab buy, else tab sell
    var network = null;
    var token, exchange; // contract
    var account = null;
    var blocked = false;
    var exchangeEth = null; // BigNumber, exchange balance in eth, or null
    var exchangeTokens = null; // BigNumber, exchange balance in tokens (*10^18), or null
    var accountEth = null; // BigNumber, account balance in eth, or null
    var accountTokens = null; // BigNumber, token balance (*10^18), or null

    window.onload = function () {
        document.getElementById('headerStart').onclick = function () {
            setPage(pageExchange);
        }
        document.getElementById('headerFaq').onclick = function () {
            setPage(pageFaq);
        }
        document.getElementById('headerBounty').onclick = function () {
            setPage(pageBounty);
        }
        document.getElementById('headerPartners').onclick = function () {
            setPage(pagePartners);
        }
        document.getElementById('buyButton').onclick = function () {
            setTab(true);
        }
        document.getElementById('sellButton').onclick = function () {
            setTab(false);
        }
        document.getElementById('exchangeButton').onclick = exchange;

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
        script.onload = function () {
            if (typeof window.ethereum === 'undefined') {
                document.getElementById('startMessage').innerHTML = 'install ' +
                    '<a href="https://metamask.io/download.html" target="_blank" rel="noopener">' +
                    'metamask</a> or use ' +
                    '<a href="https://opera.com" target="_blank" rel="noopener">opera</a>';
            } else {
                document.getElementById('startMessage').innerHTML = '';
                window.web3 = new Web3(ethereum);
                load();
                if (typeof ethereum.on !== 'undefined') {
                    ethereum.on('chainChanged', load);
                    ethereum.on('accountsChanged', load);
                    ethereum.autoRefreshOnNetworkChange = false;
                }
            }
        };
        document.body.appendChild(script);

        document.getElementById('exchangeTopInput').onchange = calculateBottom;
        document.getElementById('exchangeBottomInput').onchange = calculateTop;
        document.getElementById('exchangeTopInput').oninput = calculateBottom;
        document.getElementById('exchangeBottomInput').oninput = calculateTop;
    };

    function setPage(newPage) {
        if (page === newPage) {
            return;
        }
        page = newPage;
        document.getElementById('headerFaq').className = page === pageFaq ? 'active' : '';
        document.getElementById('headerBounty').className = page === pageBounty ? 'active' : '';
        document.getElementById('headerPartners').className = page === pagePartners ? 'active' : '';
        document.getElementById('exchange').style.display = page === pageExchange ? 'block' : 'none';
        document.getElementById('faq').style.display = page === pageFaq ? 'block' : 'none';
        document.getElementById('bounty').style.display = page === pageBounty ? 'block' : 'none';
        document.getElementById('partners').style.display = page === pagePartners ? 'block' : 'none';
    }

    function setTab(newTabBuy) {
        if (tabBuy === newTabBuy) {
            return;
        }
        tabBuy = newTabBuy;
        document.getElementById('exchangeTopLabel').innerHTML = tabBuy ? 'eth' : 'tokens';
        document.getElementById('exchangeTopHint').innerHTML = '';
        document.getElementById('exchangeTopInput').value = '';
        document.getElementById('exchangeBottomLabel').innerHTML = tabBuy ? 'tokens' : 'eth';
        document.getElementById('exchangeBottomHint').innerHTML = '';
        document.getElementById('exchangeBottomInput').value = '';
        if (account !== null) {
            document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
        }
        document.getElementById('buyButton').className = tabBuy ? 'active' : '';
        document.getElementById('sellButton').className = tabBuy ? '' : 'active';
    }

    function load() {
        web3.eth.getChainId().then(function (newNetwork) {
            newNetwork = Number(newNetwork);
            if (newNetwork !== networkMain && newNetwork !== networkRopsten) {
                network = null;
                account = null;
                printContractLinks(networkMain);
                document.getElementById('startMessage').innerHTML =
                    'switch to the mainnet or ropsten testnet';
                clearAccount();
                document.getElementById('exchangeButton').innerHTML = 'connect';
                clearExchangeInfo();
                document.getElementById('logs').innerHTML = '';
                return;
            }
            if (network !== newNetwork) {
                network = newNetwork;
                account = null;
                var tokenAddress, exchangeAddress;
                if (network === networkMain) {
                    tokenAddress = mainTokenAddress;
                    exchangeAddress = mainExchangeAddress;
                } else if (network === networkRopsten) {
                    tokenAddress = ropstenTokenAddress;
                    exchangeAddress = ropstenExchangeAddress;
                }
                token = new web3.eth.Contract(tokenAbi, tokenAddress);
                exchange = new web3.eth.Contract(exchangeAbi, exchangeAddress);
                printContractLinks(network);
                document.getElementById('startMessage').innerHTML = '';
                clearAccount();
                clearExchangeInfo();
                document.getElementById('logs').innerHTML = '';
                token.events.Transfer().on('data', function () {
                    if (token !== null && account !== null) {
                        loadAccount();
                    }
                });
                exchange.events.allEvents().on('data', function () {
                    if (exchange !== null) {
                        loadExchangeInfo();
                    }
                });
            }

            web3.eth.getAccounts().then(function (accounts) {
                if (accounts.length === 0) {
                    account = null;
                    clearAccount();
                    document.getElementById('exchangeButton').innerHTML = 'connect';
                    loadExchangeInfo();
                    document.getElementById('logs').innerHTML = '';
                    return;
                }
                if (accounts[0] === account) {
                    return;
                }
                account = accounts[0];
                clearAccount();
                loadAccount();
                document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
                clearExchangeInfo();
                loadExchangeInfo();
            });
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });
    }

    function printContractLinks(networkId) {
        var baseUrl, tokenAddress, exchangeAddress;
        switch (networkId) {
            case networkRopsten:
                baseUrl = 'https://ropsten.etherscan.io/address/';
                tokenAddress = ropstenTokenAddress;
                exchangeAddress = ropstenExchangeAddress;
                break;
            default:
                baseUrl = 'https://etherscan.io/address/';
                tokenAddress = mainTokenAddress;
                exchangeAddress = mainExchangeAddress;
        }
        document.getElementById('tokenAddress').title = tokenAddress;
        document.getElementById('tokenAddress').href = baseUrl + tokenAddress;
        document.getElementById('exchangeAddress').title = exchangeAddress;
        document.getElementById('exchangeAddress').href = baseUrl + exchangeAddress;
    }

    function clearAccount() {
        accountEth = null;
        accountTokens = null;

        document.getElementById('balanceEth').removeAttribute('title');
        document.getElementById('balanceEth').innerHTML = '...';
        document.getElementById('balanceTokens').removeAttribute('title');
        document.getElementById('balanceTokens').innerHTML = '...';
        document.getElementById('exchangeTopHint').innerHTML = '';
        document.getElementById('exchangeTopInput').value = '';
        document.getElementById('exchangeBottomHint').innerHTML = '';
        document.getElementById('exchangeBottomInput').value = '';
    }

    function clearExchangeInfo() {
        exchangeEth = null;
        exchangeTokens = null;

        var svg = document.getElementById("price").contentDocument;
        svg.getElementById('price').innerHTML = '...';
        svg.getElementById('balance').innerHTML = '...';
        svg.getElementById('line').setAttribute('x1', 190);
        svg.getElementById('line').setAttribute('y1', 133);
        svg.getElementById('pointer').setAttribute('cx', 400);
        svg.getElementById('pointer').setAttribute('cy', 400);
    }

    function loadAccount() {
        web3.eth.getBalance(account).then(function (balance) {
            accountEth = new BigNumber(balance).shiftedBy(-18);
            if (accountEth.isZero()) {
                document.getElementById('balanceEth').removeAttribute('title');
                document.getElementById('balanceEth').innerHTML = '0';
            } else {
                document.getElementById('balanceEth').title = accountEth.toFixed(18);
                balance = accountEth.toFixed(3, BigNumber.ROUND_DOWN);
                document.getElementById('balanceEth').innerHTML = balance;
            }
            return token.methods.balanceOf(account).call();
        }).then(function (balance) {
            accountTokens = new BigNumber(balance).shiftedBy(-18);
            if (accountTokens.isZero()) {
                document.getElementById('balanceTokens').removeAttribute('title');
                document.getElementById('balanceTokens').innerHTML = '0';
            } else {
                document.getElementById('balanceTokens').title = accountTokens.toFixed(18);
                balance = accountTokens.toFixed(3, BigNumber.ROUND_DOWN);
                document.getElementById('balanceTokens').innerHTML = balance;
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
        });
    }

    function loadExchangeInfo() {
        web3.eth.getBalance(exchange.options.address).then(function (balance) {
            exchangeEth = new BigNumber(balance).shiftedBy(-18);
        });
        token.methods.balanceOf(exchange.options.address).call().then(function (balance) {
            balance = new BigNumber(balance).shiftedBy(-18);
            exchangeTokens = balance;

            var x = balance.multipliedBy(3).div(50000).plus(30).toFixed(1);
            var price = new BigNumber(1).minus(balance.div(5000000));
            if (price.isNegative()) {
                price = new BigNumber(0);
            }
            var y = price.multipliedBy(-280).plus(330).toFixed(1);
            var svg = document.getElementById("price").contentDocument;
            svg.getElementById('price').innerHTML = price.toFixed(6);
            svg.getElementById('balance').innerHTML = balance.toFixed(0);
            svg.getElementById('line').setAttribute('x1', x);
            svg.getElementById('line').setAttribute('y1', y);
            svg.getElementById('pointer').setAttribute('cx', x);
            svg.getElementById('pointer').setAttribute('cy', y);
        });
    }

    function exchange() {
        if (typeof window.ethereum === 'undefined') {
            alert('ethereum is not loaded');
        } else if (network === null) {
            alert('switch to the mainnet or ropsten testnet');
        } else if (account === null) {
            new Promise(function (resolve) {
                if (typeof ethereum.request === 'undefined') {
                    ethereum.enable().then(resolve);
                } else {
                    ethereum.request({method: 'eth_requestAccounts'}).then(resolve);
                }
            }).then(function () {
                web3.eth.getChainId().then(function (newNetwork) {
                    newNetwork = Number(newNetwork);
                    if (newNetwork !== networkMain && newNetwork !== networkRopsten) {
                        alert('switch the network');
                    }
                });
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
            });
        } else if (blocked) {
            alert('confirm or reject previous tx');
        } else if (tabBuy) {
            buy();
        } else {
            sell();
        }
    }

    function buy() {
        var eth = new BigNumber(document.getElementById('exchangeTopInput').value);
        if (eth.isNaN() || eth.isNegative()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter positive number';
            document.getElementById('exchangeTopInput').value = '';
            return;
        } else if (accountEth !== null && eth.isGreaterThan(accountEth)) {
            document.getElementById('exchangeTopHint').innerHTML = 'not enough eth';
            return;
        }
        document.getElementById('exchangeTopHint').innerHTML = '';
        blocked = true;

        var message;
        exchange.methods.buy().send({
            from: account,
            value: eth.shiftedBy(18)
        }).on('transactionHash', function (hash) {
            message = logTx('purchase for ' + eth + ' ETH', hash);
            blocked = false;
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber != 0) {
                return;
            }
            if (!receipt.status) {
                message.innerHTML = ' - rejected';
            } else {
                loadAccount();
                loadExchangeInfo();
                message.innerHTML = ' - confirmed';
            }
        }).catch(function (error) {
            console.error(error);
            if (error.message) {
                error = error.message;
            }
            alert(error);
            blocked = false;
        });
    }

    function sell() {
        var tokens = new BigNumber(document.getElementById('exchangeTopInput').value);
        if (tokens.isNaN() || tokens.isNegative()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter positive number';
            document.getElementById('exchangeTopInput').value = '';
            return;
        } else if (accountTokens !== null && tokens.isGreaterThan(accountTokens)) {
            document.getElementById('exchangeTopHint').innerHTML = 'not enough tokens';
            return;
        }
        document.getElementById('exchangeTopHint').innerHTML = '';
        blocked = true;

        token.methods.allowance(
            account,
            exchange.options.address
        ).call().then(function (allowance) {
            if (new BigNumber(allowance).isLessThan('100000000000000000000000')) {
                approve();
            } else {
                transfer();
            }
        });

        function approve() {
            var message;
            token.methods.approve(
                exchange.options.address,
                '10000000000000000000000000'
            ).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = logTx('approve', hash);
                alert('confirm second transaction');
                transfer();
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    message.innerHTML = ' - confirmed';
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
                blocked = false;
            });
        }

        function transfer() {
            var message;
            exchange.methods.sell(tokens.shiftedBy(18).toFixed(0)).send({
                from: account
            }).on('transactionHash', function (hash) {
                message = logTx('sale ' + tokens + ' IQI', hash);
                blocked = false;
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadAccount();
                    loadExchangeInfo();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(function (error) {
                console.error(error);
                if (error.message) {
                    error = error.message;
                }
                alert(error);
                blocked = false;
            });
        }
    }

    function logTx(message, hash) {
        var p = document.createElement('p');
        p.classList.add('onestring');
        var span = document.createElement('span');
        span.innerHTML = message + ', tx ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = hash;
        if (network === networkMain) {
            a.href = 'https://etherscan.io/tx/' + hash;
        } else if (network === networkRopsten) {
            a.href = 'https://ropsten.etherscan.io/tx/' + hash;
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        span = document.createElement('span');
        span.innerHTML = ' - unconfirmed';
        p.appendChild(span);
        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
        return span;
    }

    function calculateTop() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        var value = document.getElementById('exchangeBottomInput').value;
        if (value === '') {
            document.getElementById('exchangeBottomHint').innerHTML = '';
            document.getElementById('exchangeTopInput').value = '';
            return;
        }
        value = new BigNumber(value);
        if (value.isNaN() || value.isNegative()) {
            document.getElementById('exchangeBottomHint').innerHTML = 'enter positive number';
            document.getElementById('exchangeTopInput').value = '';
            return;
        }
        document.getElementById('exchangeBottomHint').innerHTML = '';
        if (exchangeTokens === null) {
            return;
        } else if (tabBuy) {
            value = s(exchangeTokens.minus(value), exchangeTokens);
        } else {
            value = v(exchangeTokens, false, value).minus(exchangeTokens);
        }
        document.getElementById('exchangeTopInput').value = value.toFixed(6, BigNumber.ROUND_DOWN);
    }

    function calculateBottom() {
        document.getElementById('exchangeBottomHint').innerHTML = '';
        var value = document.getElementById('exchangeTopInput').value;
        if (value === '') {
            document.getElementById('exchangeTopHint').innerHTML = '';
            document.getElementById('exchangeBottomInput').value = '';
            return;
        }
        value = new BigNumber(value);
        if (value.isNaN() || value.isNegative()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter positive number';
            document.getElementById('exchangeBottomInput').value = '';
            return;
        }
        document.getElementById('exchangeTopHint').innerHTML = '';
        if (exchangeTokens === null) {
            return;
        } else if (tabBuy) {
            value = exchangeTokens.minus(v(exchangeTokens, true, value));
        } else {
            value = s(exchangeTokens, exchangeTokens.plus(value));
        }
        document.getElementById('exchangeBottomInput').value = value.toFixed(6, BigNumber.ROUND_DOWN);
    }

    function s(vL, vR) {
        return vR.plus(vL).dividedBy('10000000').minus(1).multipliedBy(vL.minus(vR));
    }

    function v(v0, isV0Right, s) {
        var d = new BigNumber('100000000000000');
        if (isV0Right) {
            d = d.plus(s.multipliedBy('40000000'));
        } else {
            d = d.minus(s.multipliedBy('40000000'));
        }
        d = d.plus(v0.minus('10000000').multipliedBy(v0).multipliedBy(4));
        return new BigNumber('5000000').minus(d.sqrt().dividedBy(2));
    }
})();
