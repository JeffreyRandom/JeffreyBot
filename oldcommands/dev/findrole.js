const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "findrole",
    aliases: ["find-role", "getrole", "get-role"],
    info: "Sacas el ID de un rol por su nombre",
    params: [
        {
            name: "nombre", type: "JoinString", optional: false
        },
        {
            name: "guildId", type: "Guild", optional: true
        }
    ],
    userlevel: "DEVELOPER",
    category: "DEVELOPER"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const roleName = response.find(x => x.param === "nombre").data;
        const sguild = response.find(x => x.param === "guildId").data || guild;

        // Comando
        const role = sguild.roles.cache.find(x => x.name === roleName);
        if(!role) return message.reply(`No encontré el rol \`${roleName}\` asegúrate de haberlo escrito bien.`);
    
        let finalEmbed = new Discord.MessageEmbed()
        .setAuthor(`Role: ${roleName}`, sguild.iconURL())
        .setDescription(`**—** Nombre del Role: \`${roleName}\`.
**—** ID: \`${role.id}\`.
**—** Role del servidor: \`${sguild.name}\`.`)
        .setColor(role.hexColor);
    
        return message.channel.send({embeds: [finalEmbed]});
    }
}