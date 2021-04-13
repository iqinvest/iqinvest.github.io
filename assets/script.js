'use strict';
(function () {
    var pageMain = 'main';
    var pageBounty = 'bounty';
    var pagePartners = 'partners';
    var mainTokenAddress = '0xB9076BB251285aa70E05d38fB1c061474AeFdb7a';
    var mainExchangeAddress = '0x102d766eF1c910CFa3337fC59aCE9E38Aa993e20';
    var ropstenTokenAddress = '0xe7286c430B35CE0ab7539210bD21F528dA5e5670';
    var ropstenExchangeAddress = '0xcEfe405674339E93D8b7E7329Bfaf22D7d7923c9';
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

    var page;
    var tabBuy = true;
    var web3loaded, network, token, exchange, account, accountIqi, exchangeIqi;

    window.onload = function () {
        document.getElementById('headerMain').onclick = function () {
            displayPage(pageMain, true);
        };
        document.getElementById('headerBounty').onclick = function () {
            displayPage(pageBounty, true);
        };
        document.getElementById('headerPartners').onclick = function () {
            displayPage(pagePartners, true);
        };
        document.getElementById('buyButton').onclick = function () {
            displayTab(true);
        };
        document.getElementById('sellButton').onclick = function () {
            displayTab(false);
        };
        document.getElementById('exchangeButton').onclick = proceed;

        displayPage(parsePage(), false);
        if (!window.ethereum) {
            document.getElementById('startMessage').innerHTML = 'install ' +
                '<a href="https://metamask.io/download.html" target="_blank" rel="noopener">' +
                'metamask</a> or use ' +
                '<a href="https://opera.com" target="_blank" rel="noopener">opera</a>';
        } else {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js';
            script.onload = function () {
                document.getElementById('startMessage').innerHTML = '';
                window.web3 = new Web3(ethereum);
                web3loaded = true;
                stopLoading();
                load();
                if (ethereum.on) {
                    ethereum.on('chainChanged', load);
                    ethereum.on('accountsChanged', load);
                }
            };
            document.body.appendChild(script);
        }

        document.getElementById('exchangeTopInput').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                proceed();
            } else if (event.keyCode === 27) {
                clearInput();
            }
        };
        document.getElementById('exchangeBottomInput').onkeyup = function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                proceed();
            } else if (event.keyCode === 27) {
                clearInput();
            }
        };
        document.getElementById('exchangeTopInput').onchange = calculateBottom;
        document.getElementById('exchangeBottomInput').onchange = calculateTop;
        document.getElementById('exchangeTopInput').oninput = calculateBottom;
        document.getElementById('exchangeBottomInput').oninput = calculateTop;
    };

    window.onpopstate = function () {
        displayPage(parsePage(), false);
    };

    function load() {
        web3.eth.getChainId().then(function (newNetwork) {
            newNetwork = Number(newNetwork);
            if (newNetwork !== networkMain && newNetwork !== networkRopsten) {
                network = null;
                account = null;
                document.getElementById('exchangeButton').innerHTML = 'connect';
                document.getElementById('startMessage').innerHTML =
                    'switch to the mainnet or ropsten testnet';
                printContractLinks(networkMain);
                clearExchangeInfo();
                clearAccount();
                clearLogs();
                return;
            }
            if (network !== newNetwork) {
                network = newNetwork;
                if (network === networkMain) {
                    token = new web3.eth.Contract(tokenAbi, mainTokenAddress);
                    exchange = new web3.eth.Contract(exchangeAbi, mainExchangeAddress);
                } else if (network === networkRopsten) {
                    token = new web3.eth.Contract(tokenAbi, ropstenTokenAddress);
                    exchange = new web3.eth.Contract(exchangeAbi, ropstenExchangeAddress);
                }
                token.events.Transfer().on('data', loadAccount);
                exchange.events.allEvents().on('data', loadExchangeInfo);
                account = null;
                document.getElementById('startMessage').innerHTML = '';
                printContractLinks(network);
                clearExchangeInfo();
                loadExchangeInfo();
                clearLogs();
            }

            web3.eth.getAccounts().then(function (accounts) {
                if (accounts.length === 0) {
                    account = null;
                    document.getElementById('exchangeButton').innerHTML = 'connect';
                    clearAccount();
                    clearLogs();
                    return;
                }
                if (accounts[0] === account) {
                    return;
                }
                account = accounts[0];
                document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
                clearAccount();
                loadAccount();
                logNetwork();
                logAccount();
            }).catch(error);
        }).catch(error);
    }

    function displayPage(newPage, writeInHistory) {
        page = newPage;
        document.getElementById('headerBounty').className = page === pageBounty ? 'active' : '';
        document.getElementById('headerPartners').className = page === pagePartners ? 'active' : '';
        document.getElementById('main').style.display = page === pageMain ? 'block' : 'none';
        document.getElementById('bounty').style.display = page === pageBounty ? 'block' : 'none';
        document.getElementById('partners').style.display = page === pagePartners ? 'block' : 'none';
        if (page === pageMain) {
            setTimeout(loadExchangeInfo, 100);
        } else if (page === pagePartners && document.getElementById('partners').innerHTML === '') {
            loadPartners();
        }
        if (writeInHistory) {
            history.pushState(null, page, '?page=' + page);
        }
    }

    function printContractLinks(network) {
        if (network === networkMain) {
            document.getElementById('tokenAddress').href =
                'https://etherscan.io/address/' + mainTokenAddress;
            document.getElementById('exchangeAddress').href =
                'https://etherscan.io/address/' + mainExchangeAddress;
        } else if (network === networkRopsten) {
            document.getElementById('tokenAddress').href =
                'https://ropsten.etherscan.io/address/' + ropstenTokenAddress;
            document.getElementById('exchangeAddress').href =
                'https://ropsten.etherscan.io/address/' + ropstenExchangeAddress;
        }
    }

    function displayTab(newTabBuy) {
        tabBuy = newTabBuy;
        document.getElementById('buyButton').className = tabBuy ? 'active' : '';
        document.getElementById('sellButton').className = tabBuy ? '' : 'active';
        document.getElementById('exchangeTopLabel').innerHTML = tabBuy ? 'eth' : 'iqi';
        document.getElementById('exchangeBottomLabel').innerHTML = tabBuy ? 'iqi' : 'eth';
        clearInput();
        if (account) {
            document.getElementById('exchangeButton').innerHTML = tabBuy ? 'buy' : 'sell';
        }
    }

    function clearAccount() {
        accountIqi = null;
        document.getElementById('balanceEth').removeAttribute('title');
        document.getElementById('balanceEth').innerHTML = '...';
        document.getElementById('balanceTokens').removeAttribute('title');
        document.getElementById('balanceTokens').innerHTML = '...';
        clearInput();
    }

    function loadAccount() {
        if (!network || !token || !account) {
            return;
        }
        web3.eth.getBalance(account).then(function (balance) {
            balance = new BigNumber(balance).shiftedBy(-18);
            printValue(balance, document.getElementById('balanceEth'));
        }).catch(error);
        token.methods.balanceOf(account).call().then(function (balance) {
            accountIqi = new BigNumber(balance).shiftedBy(-18);
            printValue(accountIqi, document.getElementById('balanceTokens'));
        }).catch(error);

        function printValue(value, element) {
            if (value.isZero()) {
                element.removeAttribute('title');
                element.innerHTML = '0';
            } else {
                element.title = value.toFixed(18);
                if (value.isGreaterThan(0.001)) {
                    element.innerHTML = value.toFixed(3, BigNumber.ROUND_DOWN);
                } else if (value.isGreaterThan(0.000001)) {
                    element.innerHTML = value.toFixed(6, BigNumber.ROUND_DOWN);
                } else {
                    element.innerHTML = value.toExponential(3, BigNumber.ROUND_DOWN);
                }
            }
        }
    }

    function clearInput() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        document.getElementById('exchangeTopInput').value = '';
        document.getElementById('exchangeBottomHint').innerHTML = '';
        document.getElementById('exchangeBottomInput').value = '';
    }

    function calculateTop() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        document.getElementById('exchangeBottomHint').innerHTML = '';
        var value = document.getElementById('exchangeBottomInput').value;
        if (value === '') {
            document.getElementById('exchangeTopInput').value = '';
            return;
        }
        value = new BigNumber(value);
        if (value.isNaN() || value.isNegative()) {
            document.getElementById('exchangeBottomHint').innerHTML = 'enter a positive number';
            document.getElementById('exchangeTopInput').value = '';
            return;
        }
        if (!exchangeIqi) {
            return;
        } else if (tabBuy) {
            if (value.isGreaterThan(exchangeIqi)) {
                document.getElementById('exchangeBottomHint').innerHTML = 'too big value';
                document.getElementById('exchangeTopInput').value = '';
                return;
            }
            value = s(exchangeIqi.minus(value), exchangeIqi);
        } else {
            value = v(exchangeIqi, false, value).minus(exchangeIqi);
            if (value.isNaN()) {
                document.getElementById('exchangeBottomHint').innerHTML = 'too big value';
                document.getElementById('exchangeTopInput').value = '';
                return;
            }
        }
        document.getElementById('exchangeTopInput').value = value.toFixed(6, BigNumber.ROUND_DOWN);
    }

    function calculateBottom() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        document.getElementById('exchangeBottomHint').innerHTML = '';
        var value = document.getElementById('exchangeTopInput').value;
        if (value === '') {
            document.getElementById('exchangeBottomInput').value = '';
            return;
        }
        value = new BigNumber(value);
        if (value.isNaN() || value.isNegative()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter a positive number';
            document.getElementById('exchangeBottomInput').value = '';
            return;
        }
        if (!exchangeIqi) {
            return;
        } else if (tabBuy) {
            value = v(exchangeIqi, true, value);
            if (value.isNegative()) {
                document.getElementById('exchangeTopHint').innerHTML = 'too big value';
                document.getElementById('exchangeBottomInput').value = '';
                return;
            }
            value = exchangeIqi.minus(value);
        } else {
            value = exchangeIqi.plus(value);
            if (value.isGreaterThan(5000000)) {
                document.getElementById('exchangeTopHint').innerHTML = 'too big value';
                document.getElementById('exchangeBottomInput').value = '';
                return;
            }
            value = s(exchangeIqi, value);
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

    function proceed() {
        if (!window.ethereum) {
            alert('ethereum is not supported');
        } else if (!web3loaded) {
            startLoading();
        } else if (!network) {
            alert('switch to the mainnet or ropsten testnet');
        } else if (!account) {
            startLoading();
            if (!ethereum.request) {
                ethereum.enable().then(stopLoading).catch(error);
            } else {
                ethereum.request({method: 'eth_requestAccounts'}).then(stopLoading).catch(error);
            }
        } else if (tabBuy) {
            buy();
        } else {
            sell();
        }
    }

    function buy() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        var eth = new BigNumber(document.getElementById('exchangeTopInput').value);
        if (eth.isNaN()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter a number';
            document.getElementById('exchangeTopInput').focus();
            return;
        } else if (eth.isNegative() || eth.isZero()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter a positive number';
            document.getElementById('exchangeTopInput').focus();
            return;
        }
        startLoading();
        web3.eth.getBalance(account).then(function (balance) {
            balance = new BigNumber(balance).shiftedBy(-18);
            if (balance.isZero()) {
                document.getElementById('exchangeTopHint').innerHTML = 'you have no eth';
                stopLoading();
                return;
            } else if (eth.isGreaterThan(balance)) {
                document.getElementById('exchangeTopHint').innerHTML =
                    'enter a number less than ' + balance.toFixed(6, BigNumber.ROUND_FLOOR);
                document.getElementById('exchangeTopInput').focus();
                stopLoading();
                return;
            }
            var message;
            exchange.methods.buy().send({
                from: account,
                value: eth.shiftedBy(18)
            }).on('transactionHash', function (hash) {
                document.getElementById('exchangeTopInput').value = '';
                document.getElementById('exchangeBottomInput').value = '';
                message = logTx('purchase for ' + eth + ' eth', hash);
                stopLoading();
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadExchangeInfo();
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        }).catch(error);
    }

    function sell() {
        document.getElementById('exchangeTopHint').innerHTML = '';
        var tokens = new BigNumber(document.getElementById('exchangeTopInput').value);
        if (tokens.isNaN()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter a number';
            document.getElementById('exchangeTopInput').focus();
            return;
        } else if (tokens.isNegative() || tokens.isZero()) {
            document.getElementById('exchangeTopHint').innerHTML = 'enter a positive number';
            document.getElementById('exchangeTopInput').focus();
            return;
        } else if (accountIqi) {
            if (accountIqi.isZero()) {
                displayTab(true);
                document.getElementById('exchangeTopHint').innerHTML = 'you have no iqi';
                document.getElementById('exchangeTopInput').focus();
                return;
            } else if (tokens.isGreaterThan(accountIqi)) {
                document.getElementById('exchangeTopHint').innerHTML = 'insufficient balance';
                document.getElementById('exchangeTopInput').value = accountIqi.toFixed(18);
                document.getElementById('exchangeTopInput').focus();
                return;
            }
        }
        startLoading();
        token.methods.allowance(
            account,
            exchange.options.address
        ).call().then(function (allowance) {
            if (new BigNumber(allowance).shiftedBy(-18).isLessThan(tokens)) {
                approve();
            } else {
                transfer();
            }
        }).catch(error);

        function approve() {
            var message;
            token.methods.approve(
                exchange.options.address,
                '100000000000000000000000000'
            ).send({
                from: account
            }).on('transactionHash', function (hash) {
                document.getElementById('exchangeTopInput').value = '';
                document.getElementById('exchangeBottomInput').value = '';
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
            }).catch(error);
        }

        function transfer() {
            var message;
            exchange.methods.sell(
                tokens.shiftedBy(18).toFixed(0)
            ).send({
                from: account
            }).on('transactionHash', function (hash) {
                document.getElementById('exchangeTopInput').value = '';
                document.getElementById('exchangeBottomInput').value = '';
                message = logTx('sale of ' + tokens + ' iqi', hash);
                stopLoading();
            }).on('confirmation', function (confirmationNumber, receipt) {
                if (confirmationNumber != 0) {
                    return;
                }
                if (!receipt.status) {
                    message.innerHTML = ' - rejected';
                } else {
                    loadExchangeInfo();
                    loadAccount();
                    message.innerHTML = ' - confirmed';
                }
            }).catch(error);
        }
    }

    function clearExchangeInfo() {
        exchangeIqi = null;
        var svg = document.getElementById('price').contentDocument;
        svg.getElementById('pointer').setAttribute('cx', -1000);
        svg.getElementById('pointer').setAttribute('cy', -1000);
        svg.getElementById('price').innerHTML = '...';
        svg.getElementById('volume').innerHTML = '...';
    }

    function loadExchangeInfo() {
        if (!network || !token || !exchange) {
            return;
        }
        token.methods.balanceOf(exchange.options.address).call().then(function (balance) {
            exchangeIqi = new BigNumber(balance).shiftedBy(-18);
            var x = exchangeIqi.multipliedBy(-3).div(500).plus(30047).toFixed(1);
            var y = exchangeIqi.multipliedBy(3).div(500).minus(29670).toFixed(1);
            var price = exchangeIqi.div(-5000000).plus(1).toFixed(6);
            var volume = exchangeIqi.minus(5000000).div(-1000).toFixed(3);
            var svg = document.getElementById('price').contentDocument;
            svg.getElementById('pointer').setAttribute('cx', x);
            svg.getElementById('pointer').setAttribute('cy', y);
            svg.getElementById('price').innerHTML = price;
            svg.getElementById('volume').innerHTML = volume;
        }).catch(error);
    }

    function clearLogs() {
        document.getElementById('logs').innerHTML = '';
    }

    function logNetwork() {
        var div = document.getElementById('logs');
        if (div.innerHTML !== '') {
            return;
        }
        var p = document.createElement('p');
        if (network === networkMain) {
            p.innerHTML = 'ethereum mainnet';
        } else if (network === networkRopsten) {
            p.innerHTML = 'ethereum ropsten test network';
        }
        div.insertBefore(p, div.firstChild);
    }

    function logAccount() {
        var p = document.createElement('p');
        p.className = 'onestring';
        var span = document.createElement('span');
        span.innerHTML = 'account ';
        p.appendChild(span);
        var a = document.createElement('a');
        a.innerHTML = web3.utils.toChecksumAddress(account);
        if (network === networkMain) {
            a.href = 'https://etherscan.io/address/' + account;
        } else if (network === networkRopsten) {
            a.href = 'https://ropsten.etherscan.io/address/' + account;
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        p.appendChild(a);
        var div = document.getElementById('logs');
        div.insertBefore(p, div.firstChild);
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

    function loadPartners() {
        startLoading();
        fetch('/assets/partners.html').then(function (response) {
            if (!response.ok) {
                response.text().then(console.error);
                throw new Error(response.status);
            }
            return response.text();
        }).then(function (text) {
            if (document.getElementById('partners').innerHTML === '') {
                document.getElementById('partners').innerHTML = text;
            }
            stopLoading();
        }).catch(function (error) {
            stopLoading();
            console.error(error);
        });
    }

    function startLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    function stopLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    function error(error) {
        stopLoading();
        console.error(error);
        if (error.message) {
            error = error.message;
        }
        alert('error: ' + error);
    }

    function parsePage() {
        var parsedPage = parse('page');
        if (parsedPage === pageBounty || parsedPage === pagePartners) {
            return parsedPage;
        } else {
            return pageMain;
        }

        function parse(querry) {
            var startIndex = window.location.search.indexOf(querry + '=');
            if (startIndex < 0) {
                return null;
            }
            startIndex = startIndex + querry.length + 1;
            var stopIndex = window.location.search.indexOf('&', startIndex);
            if (stopIndex < 0) {
                return window.location.search.substring(startIndex);
            } else {
                return window.location.search.substring(startIndex, stopIndex);
            }
        }
    }
})();