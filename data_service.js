const Discord = require("discord.js");
const CoinMarketCap = require("coinmarketcap-api");
const client = new CoinMarketCap();

var isUpdating = false;
var coins = [];

module.exports.Initialize = () => {
    return new Promise((resolve, reject) => {
        updateTop100().then(data => {
            resolve(data)
        }).then(() => {

            //schedule update every endpoint refresh (5min)
            isUpdating = setInterval(() => {
                updateTop100().then(data => console.log(data)).catch(data => console.log(data));
            }, 300000)  //(5m * 60s * 1000ms).

        }).catch(data => {
            reject(data)
        });
    });
}

function getLocalTicker(symbol) {
    return new Promise((resolve, reject) => {

        var found = false;
        var coin =  coins.find(token => {
                        if (token.symbol.toLowerCase() == symbol) {                            
                            found = true;
                            return token;
                        }
                    })

        found ? resolve(coin) : reject(symbol);
    });
}

/*

//Use for coins over top 100 that want to be displayed
//Must still consider APi limitations
module.exports.display = (symbols) => {

    return new Promise((resolve, reject) => {

        var promisedCoins = symbols.map(symbol => {

            return client.getTicker({ currency: symbol }).then(details => {
                console.log(`Request for '${details.data.name}' succesful!`);
                return toDiscordCoin(details.data);
            }).catch(data => {
                console.log(`Request for symbol '${symbol}' has been rejected. (${data.message})`);
                reject(`I cannot recognize the symbol '${symbol}'`);
            });

        });

        //wait for array of promises
        Promise.all(promisedCoins).then(results => {
            resolve(results);
        }).catch(console.error);
    });
}

*/


/***********************************************
 *                ALERT FUNCTIONS              *
 ***********************************************/

module.exports.alert = events => {

    return new Promise((resolve, reject) => {

        var alertList = events.map(event => {

            var alert = {
                coin: event.split("@").shift(),
                price: event.split("@").pop()
            }

            return getLocalTicker(alert.coin).then((coinObj) => {
                if (isNaN(alert.price)) {
                    reject(`price point requested for '${event}' must be a number.`);
                } else {

                    var tmp = {
                        coin: coinObj,
                        price: alert.price
                    }

                    return tmp;
                }
            }).catch(() => {
                reject(`symbol requested at '${event}' is not a symbol or is not a part of the top 100.`)
            });


        });

        Promise.all(alertList).then(data =>

            //TODO: Use dataset here to add to DB

            resolve(toDiscordAlertConfirmation(data))
        ).catch(data => console.log(data));
    });
}

function toDiscordAlertConfirmation(alertList) {

    var embed = new Discord.RichEmbed();

    alertList.forEach(alert => {
        embed.addField(`+ added ${alert.coin.name.toUpperCase()} reaches $${alert.price}`, `- current: $${alert.coin.quotes.USD.price}`);
    })

    embed.setTitle("Alerts");
    embed.setColor("E0433C");
    embed.setTimestamp();
    embed.setFooter("Added");
    return embed;

}


/*************************************************
 *                DISPLAY FUNCTIONS              *
 *************************************************/

module.exports.display = (symbols) => {

    return new Promise((resolve, reject) => {

        var extraction = symbols.map(symbol => {

            return getLocalTicker(symbol).then(coin => {

                return toDiscordCoin(coin);
            }).catch(symbol => reject(`'${symbol}' coin does not exist or is not part of top 100!`));
        });

        //wait for extraction to populate
        Promise.all(extraction).then(updates => {
            resolve(updates);
        }).catch(console.err);
    })
}

function toDiscordCoin(coin) {

    var sign_1h = getOperator(coin.quotes.USD.percent_change_1h);
    var sign_24h = getOperator(coin.quotes.USD.percent_change_24h);
    var sign_7d = getOperator(coin.quotes.USD.percent_change_7d);

    var embed = new Discord.RichEmbed();

    embed.setColor("FD9D45");
    embed.setTitle(coin.name);
    embed.setDescription(
        `\`\`\`diff
USD:        $ ${insertCommas(coin.quotes.USD.price.toFixed(2))}
24h Volume: $ ${insertCommas(coin.quotes.USD.volume_24h)}
Market Cap: $ ${insertCommas(coin.quotes.USD.market_cap)}
Circulating Supply: $ ${insertCommas(coin.circulating_supply)}
Max Supply:         $ ${coin.circulating_supply ? insertCommas(coin.circulating_supply) : "None"}
${sign_1h} (1h):       % ${addSpace(sign_1h)}${coin.quotes.USD.percent_change_1h.toFixed(2)}
${sign_24h} (24h):      % ${addSpace(sign_24h)}${coin.quotes.USD.percent_change_24h.toFixed(2)}
${sign_7d} (7d):       % ${addSpace(sign_7d)}${coin.quotes.USD.percent_change_7d.toFixed(2)}

Currency data captured from\t\t\t"${getCoinURL(coin.name)}"
\`\`\``);  //re-design this to pull from global variable 'options' passed to market object.
    embed.setTimestamp();
    embed.setFooter(coin.symbol, getCoinImageURL(coin.id));
    return embed;
}

function getOperator(x) {

    return (x >= 0) ? "+" : "-";
}

function addSpace(x) {
    return (x === "+") ? " " : "";
}

function insertCommas(x) {
    return (x > 1) ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : x;
}

function getCoinURL(name) {
    return `https://coinmarketcap.com/currencies/${name.toLowerCase()}/`;
}

function getCoinImageURL(id) {

    var url;

    try {
        url = `https://s2.coinmarketcap.com/static/img/coins/16x16/${id}.png`
    } catch (e) {
        console.log(`rror retreiving coin image URL: ${e.message}`);
        url = "https://cdn.discordapp.com/embed/avatars/0.png";
    }

    return url;
}

function getGraphURL(id){
    return `https://s2.coinmarketcap.com/generated/sparklines/web/7d/usd/${id}.png`
}

/*************************************************
 *                 UPDATE FUNCTIONS              *
 *************************************************/

function updateTop100() {
    return new Promise((resolve, reject) => {

        client.getTicker().then(token => {

            //push contents of each object identifier 'x' inside token.
            Object.keys(token.data).forEach(x => {
                coins.push(token.data[x]);
            })
            resolve("Top 100 coin list update successful");
        }).catch(data => {
            reject(`Top 100 coin list update failed! ${data.message}`);
        });
    });
}