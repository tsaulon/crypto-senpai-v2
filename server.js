const token = "";

const data_service = require("./data_service.js");
const Discord = require("discord.js");
const client = new Discord.Client();

//Initialize new coin data
data_service.Initialize().then( data =>

    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
        console.log(data);

})).catch(data => console.log(data));


client.on("message", msg => {

    var action = msg.content.toLowerCase().split(" ")[0];
    var args = msg.content.toLowerCase().split(" ").slice(1);

    switch(action){
        case "display":
            data_service.display(args).then(dataArray => {
                dataArray.forEach(embed => {
                    console.log(`Sending to channel: ${msg.channel.id}`)
                    msg.channel.send(embed);
                });
            }).catch(data => {
                msg.reply(data)
            });        
            break;
            
        case "save":
            console.log("watch");
            break;
        case "delete":
            console.log("delete");
            break;
        case "alert":
            data_service.alert(args).then(embeds => {
                msg.channel.send(embeds);
            }).catch(data => {
                msg.reply(data);
            })
            break;
        case "test":
            data_service.test();
    }

});

client.login(token);

/*
 * Restriction: API Rate Limit: 30 calls per minute per ip (5 min endpoint refresh)
 * 
 * TODO:    >Periodically get full listings every minutes and store onto server array.
*           >Users make requests to the array instead of using up API restrictions
*           >Use DB to save channel's coin lists
 */