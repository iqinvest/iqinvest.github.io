"use strict";

(function () {
    var mainTokenAddress = '0xB9076BB251285aa70E05d38fB1c061474AeFdb7a';
    var mainExchangeAddress = '0x102d766eF1c910CFa3337fC59aCE9E38Aa993e20';
    var ropstenTokenAddress = '0xe7286c430B35CE0ab7539210bD21F528dA5e5670';
    var ropstenExchangeAddress = '0xcEfe405674339E93D8b7E7329Bfaf22D7d7923c9';
    var goerliTokenAddress = '';
    var goerliExchangeAddress = '';
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
    var pageExchange = 0;
    var pageFaq = 1;
    var networkMain = 1;
    var networkRopsten = 3;
    var networkGoerli = 5;

    var page = pageExchange; // current page displayed
    var tabBuy = true; // if true, tab buy, else tab sell
    var blocked = true; // block button if there is unfinished action or page is not loaded
    var network = null; // current network or null (if there is no address for this network)
    var tokenContract = null; // instance of web3.Contract or null
    var exchangeContract = null; // instance of web3.Contract or null
    var account = null; // string '0x....' or null (if logout)
    var exchangeEth = null; // BigNumber, exchange balance in eth, or null
    var exchangeTokens = null; // BigNumber, exchange balance in tokens (*10^18), or null
    var accountEth = null; // BigNumber, account balance in eth, or null
    var accountTokens = null; // BigNumber, token balance (*10^18), or null
    var eventTokenBlockHash; // block hash of the last event for token
    var eventExchangeBlockHash; // block hash of the last event for exchange

    window.onload = function () {
        document.getElementById('headerLogo').onclick = function () {
            setPage(pageExchange);
        }
        document.getElementById('headerExchange').onclick = function () {
            setPage(pageExchange);
        }
        document.getElementById('headerFaq').onclick = function () {
            setPage(pageFaq);
        }
        document.getElementById('buyButton').onclick = function () {
            setTab(true);
        }
        document.getElementById('sellButton').onclick = function () {
            setTab(false);
        }
        document.getElementById('exchangeButton').onclick = exchange;
        printContractLinks(networkMain);

        loadScript('assets/bignumber.min.js', function () {
            loadScript('assets/web3.min.js', init);
        });

        function loadScript(url, callback) {
            var script = document.createElement('script');
            script.src = url;
            script.onload = callback;
            document.body.appendChild(script);
        }

        document.getElementById('exchangeTopInput').onchange = calculateBottom;
        document.getElementById('exchangeBottomInput').onchange = calculateTop;
        document.getElementById('exchangeTopInput').oninput = calculateBottom;
        document.getElementById('exchangeBottomInput').oninput = calculateTop;
    };

    function init() {
        if (typeof window.ethereum === 'undefined') {
            document.getElementById('notSupported').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        } else {
            window.web3 = new Web3(ethereum);
            ethereum.on('accountsChanged', function (accounts) {
                if (accounts.length > 0) {
                    if (accounts[0] !== account) {
                        blocked = true;
                        account = accounts[0];
                        clearAccount();
                        loadAccount();
                    }
                } else {
                    account = null;
                    clearAccount();
                    document.getElementById('exchangeButton').innerHTML = 'connect';
                    document.getElementById('logs').innerHTML = '';
                }
            });
            ethereum.on('networkChanged', function (newNetwork) {
                blocked = true;
                loadNetwork(newNetwork);
                clearAccount();
                loadAccount();
                document.getElementById('logs').innerHTML = '';
            });
            ethereum.autoRefreshOnNetworkChange = false;

            web3.eth.net.getId().then(function (newNetwork) {
                loadNetwork(newNetwork);
                document.getElementById('loading').style.display = 'none';
                blocked = false;
            });
        }
    }

    function loadNetwork(newNetwork) {
        newNetwork = Number(newNetwork);
        var tokenAddress, exchangeAddress;
        if (newNetwork === networkMain && mainTokenAddress && mainExchangeAddress) {
            tokenAddress = mainTokenAddress;
            exchangeAddress = mainExchangeAddress;
        } else if (newNetwork === networkRopsten && ropstenTokenAddress && ropstenExchangeAddress) {
            tokenAddress = ropstenTokenAddress;
            exchangeAddress = ropstenExchangeAddress;
        } else if (newNetwork === networkGoerli && goerliTokenAddress && goerliExchangeAddress) {
            tokenAddress = goerliTokenAddress;
            exchangeAddress = goerliExchangeAddress;
        } else {
            network = null;
            tokenContract = null;
            exchangeContract = null;
            document.getElementById('switchNetwork').style.display = 'block';
            printContractLinks(network);
            clearExchangeInfo();
            return;
        }
        network = newNetwork;
        tokenContract = new web3.eth.Contract(tokenAbi, tokenAddress);
        exchangeContract = new web3.eth.Contract(exchangeAbi, exchangeAddress);
        document.getElementById('switchNetwork').style.display = 'none';
        printContractLinks(network);
        clearExchangeInfo();
        loadExchangeInfo();

        tokenContract.events.Transfer().on('data', function (event) {
            var hash = event.blockHash;
            if (eventTokenBlockHash !== hash) {
                eventTokenBlockHash = hash;
                loadAccount();
            }
        });
        exchangeContract.events.allEvents().on('data', function (event) {
            var hash = event.blockHash;
            if (eventExchangeBlockHash !== hash) {
                eventExchangeBlockHash = hash;
                loadExchangeInfo();
            }
        });
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

    function loadExchangeInfo() {
        if (exchangeContract === null) {
            return;
        }
        web3.eth.getBalance(exchangeContract.options.address).then(function (balance) {
            exchangeEth = new BigNumber(balance).shiftedBy(-18);
        });
        if (tokenContract === null) {
            return;
        }
        tokenContract.methods.balanceOf(exchangeContract.options.address).call().then(function (balance) {
            exchangeTokens = new BigNumber(balance).shiftedBy(-18);
            displayExchangeInfo(exchangeTokens);
        });
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

    function loadAccount() {
        if (tokenContract === null || account === null) {
            blocked = false;
            return;
        }

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
            return tokenContract.methods.balanceOf(account).call();
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
            document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
            blocked = false;
        }).catch(function (error) {
            console.log(error.message);
            blocked = false;
        });
    }

    function exchange() {
        if (blocked) {
            return;
        } else if (network === null || tokenContract === null || exchangeContract === null) {
            alert('switch the network');
            return;
        }

        blocked = true;
        if (account === null) {
            ethereum.enable().then(function (accounts) {
                if (accounts.length > 0) {
                    account = accounts[0];
                    loadAccount();
                } else {
                    account = null;
                    clearAccount();
                    document.getElementById('exchangeButton').innerHTML = 'connect';
                    document.getElementById('logs').innerHTML = '';
                    blocked = false;
                }
            }).catch(function (error) {
                console.log(error.message);
                blocked = false;
            });
        } else if (accountEth === null || accountTokens === null) {
            loadAccount();
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
            blocked = false;
            return;
        } else if (eth.isGreaterThan(accountEth)) {
            document.getElementById('exchangeTopHint').innerHTML = 'not enough eth';
            blocked = false;
            return;
        }
        document.getElementById('exchangeTopHint').innerHTML = '';

        var waitMessage;
        exchangeContract.methods.buy().send({
            from: account,
            value: eth.shiftedBy(18).toFixed(0)
        }).on('transactionHash', function (hash) {
            blocked = false;
            waitMessage = document.createElement('span');
            waitMessage.innerHTML = ', waiting confirmation...';
            printLog('tx/' + hash, 'purchase, ', hash, waitMessage);
        }).on('confirmation', function (confirmationNumber, receipt) {
            if (confirmationNumber == 0) {
                waitMessage.innerHTML = receipt.status ? ', confirmed' : ', rejected';
            }
        }).catch(function (error) {
            blocked = false;
            console.log(error.message);
        });
    }

    function sell() {
        var tokens = new BigNumber(document.getElementById('exchangeTopInput').value);
        if (tokens.isNaN() || tokens.isNegative()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter positive number';
            document.getElementById('exchangeTopInput').value = '';
            blocked = false;
            return;
        } else if (tokens.isGreaterThan(accountTokens)) {
            document.getElementById('exchangeTopHint').innerHTML = 'not enough tokens';
            blocked = false;
            return;
        }
        document.getElementById('exchangeTopHint').innerHTML = '';

        tokenContract.methods.allowance(
            account,
            exchangeContract.options.address
        ).call().then(function (allowance) {
            if (new BigNumber(allowance).isLessThan('1000000000000000000000000')) {
                approve();
            } else {
                transfer();
            }
        });

        function approve() {
            var waitMessage;
            tokenContract.methods.approve(
                exchangeContract.options.address,
                '10000000000000000000000000'
            ).send({
                from: account
            }).on('transactionHash', function (hash) {
                waitMessage = document.createElement('span');
                waitMessage.innerHTML = ', waiting confirmation...';
                printLog('tx/' + hash, 'approve, ', hash, waitMessage);
                transfer();
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    waitMessage.innerHTML = receipt.status ? ', confirmed' : ', rejected';
                }
            }).catch(function (error) {
                blocked = false;
                console.log(error.message);
            });
        }

        function transfer() {
            var waitMessage;
            exchangeContract.methods.sell(tokens.shiftedBy(18).toFixed(0)).send({
                from: account
            }).on('transactionHash', function (hash) {
                blocked = false;
                waitMessage = document.createElement('span');
                waitMessage.innerHTML = ', waiting confirmation...';
                printLog('tx/' + hash, 'sale, ', hash, waitMessage);
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber == 0) {
                    waitMessage.innerHTML = receipt.status ? ', confirmed' : ', rejected';
                }
            }).catch(function (error) {
                blocked = false;
                console.log(error.message);
            });
        }
    }

    function setPage(newPage) {
        if (page === newPage) {
            return;
        }
        page = newPage;
        document.getElementById('exchange').style.display = page === pageExchange ? 'block' : 'none';
        document.getElementById('faq').style.display = page === pageFaq ? 'block' : 'none';
        document.getElementById('headerExchange').className = page === pageExchange ? 'active' : '';
        document.getElementById('headerFaq').className = page === pageFaq ? 'active' : '';
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
        if (account !== null && accountEth !== null && accountTokens !== null) {
            document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
        }
        document.getElementById('buyButton').className = tabBuy ? 'active' : '';
        document.getElementById('sellButton').className = tabBuy ? '' : 'active';
    }

    function printContractLinks(networkId) {
        var baseUrl, tokenAddress, exchangeAddress;
        switch (networkId) {
            case networkRopsten:
                baseUrl = 'https://ropsten.etherscan.io/address/';
                tokenAddress = ropstenTokenAddress;
                exchangeAddress = ropstenExchangeAddress;
                break;
            case networkGoerli:
                baseUrl = 'https://goerli.etherscan.io/address/';
                tokenAddress = goerliTokenAddress;
                exchangeAddress = goerliExchangeAddress;
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

    function displayExchangeInfo(balance) {
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
    }

    function printLog(path, prefix, message, suffix) {
        if (message === null || network === null) {
            return;
        }
        var p = document.createElement('p');
        p.classList.add('onestring');
        if (prefix) {
            var span = document.createElement('span');
            span.innerHTML = prefix;
            p.appendChild(span);
        }
        var a = document.createElement('a');
        a.innerHTML = message;
        if (network === networkMain) {
            a.href = 'https://etherscan.io/' + path;
        } else if (network === networkRopsten) {
            a.href = 'https://ropsten.etherscan.io/' + path;
        } else if (network === networkGoerli) {
            a.href = 'https://goerli.etherscan.io/' + path;
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        if (suffix) {
            p.appendChild(suffix);
        }

        var logs = document.getElementById('logs');
        logs.insertBefore(p, logs.firstChild);
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
