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

            //schedule update every 5 minutes
            isUpdating = setInterval(() => {
                updateTop100().then(data => console.log(data)).catch(data => console.log(data));
            }, 300000)  //(5min * 60sec * 1000).

        }).catch(data => {
            reject(data)
        }); 
    });
}

module.exports.display = (symbols) => {
    
    return new Promise((resolve, reject) => {

        var extraction = [];

        //find symbols requested from coins array and convert into embed message object
        symbols.forEach(x => {
            try{
                coins.filter(coin => {
                    if(coin.symbol.toLowerCase() == x){
                        extraction.push(toDiscord(coin));
                    }
                });
            } catch(e) {

            }
        });

        //wait for extraction to populate
        Promise.all(extraction).then(updates => {
            resolve(updates);
        }).catch(console.err);
    })
}

function coinExists(symbol){
    
    var found = false;
    var coin;

    coins.filter(token => {
        if(token.symbol.toLowerCase() == symbol){
            //TODO: check existence of coin.
        }
    })
}

/*

//Use for coins over top 100 that want to be displayed
module.exports.display = (symbols) => {

    return new Promise((resolve, reject) => {

        var promisedCoins = symbols.map(symbol => {

            return client.getTicker({ currency: symbol }).then(details => {
                console.log(`Request for '${details.data.name}' succesful!`);
                return toDiscord(details.data);
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


/* This function builds a string using a received coin object */
function toDiscord(coin) {

    var sign_1h = getOperator(coin.quotes.USD.percent_change_1h);
    var sign_24h = getOperator(coin.quotes.USD.percent_change_24h);
    var sign_7d = getOperator(coin.quotes.USD.percent_change_7d);

    var embed = new Discord.RichEmbed();

    embed.setColor("FD9D45");
    embed.setTitle(coin.name);
    embed.setDescription(
        `\`\`\`diff
USD:          $ ${insertCommas(coin.quotes.USD.price)}
24h Volume:   $ ${insertCommas(coin.quotes.USD.volume_24h)}
Market Cap:   $ ${insertCommas(coin.quotes.USD.market_cap)}
${sign_1h} (1h):       % ${addSpace(sign_1h)}${coin.quotes.USD.percent_change_1h.toFixed(2)}
${sign_24h} (24h):      % ${addSpace(sign_24h)}${coin.quotes.USD.percent_change_24h.toFixed(2)}
${sign_7d} (7d):       % ${addSpace(sign_7d)}${coin.quotes.USD.percent_change_7d.toFixed(2)}
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

function updateTop100(){
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