const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "say",
    aliases: ["di", "decir"],
    info: "Repito lo que me digas",
    params: [
        {
            name: "texto", display: "lo que quieras que diga", type: "JoinString", optional: false
        }
    ],
    userlevel: "USER",
    category: "FUN"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error
        const toSay = response.find(x => x.param === "texto").data;

        // Comando
        if(message.mentions.users.size === 0) message.delete();
        message.channel.send({content: toSay, allowedMentions: { parse: [] } });
    }
}