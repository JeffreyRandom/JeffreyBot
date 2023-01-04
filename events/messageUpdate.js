const { Config, Colores } = require("../src/resources");
const { startLinks } = require("../index.js");
const { GenerateLog } = require("../src/utils/functions");
const { codeBlock } = require("discord.js");

module.exports = async (client, oldMessage, message) => {
    const prefix = "/";
    const channel = message.channel;
    const member = message.member;
  
    if (member.user.bot) return;
    if (message.channel.type == "DM") return;
    if (member.user.bot) return;
    if (message.content.startsWith(prefix)) return;

    GenerateLog(message.guild, {
      header: `Se ha editado un mensaje`,
      footer: `${member.user.tag}`,
      description: [
        `Ahora: ${codeBlock(message.content)}`,
        `Antes: ${codeBlock(oldMessage.content) ?? codeBlock("js", "null")}`,
        `ID: \`${message.id}\`.`
      ],
      header_icon: message.guild.iconURL({ dynamic: true }),
      footer_icon: member.displayAvatarURL({dynamic: true}),
      color: Colores.verdejeffrey
    })
  
    let adminRole = message.guild.roles.cache.find(x => x.id === Config.adminRole);
    let modRole = message.guild.roles.cache.find(x => x.id === Config.modRole);
    let staffRole = message.guild.roles.cache.find(x => x.id === Config.staffRole);
    let offtopicChannel = message.guild.channels.cache.find(x => x.id === Config.offtopicChannel);
    let spamChannel = message.guild.channels.cache.find(x => x.id === Config.spamChannel);
    let gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === Config.gdpsSupportChannel);
  
    if(client.user.id === Config.testingJBID){
      adminRole = message.guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = message.guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = message.guild.roles.cache.find(x => x.id === "535203102534402063");
      offtopicChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
      spamChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
      gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    }
    // TODO: links
    if (member.permissions.has("EMBED_LINKS") || channel === offtopicChannel || channel === spamChannel || channel === gdpsSupportChannel) return;
  
    for (let i = 0; i < startLinks.length; i++) {
      const start = startLinks[i];
      
      if(contentMsg.includes(start)){
        await message.delete();
        return message.channel.send(`No envíes links, **${member.tag}**`);
      }
    }
}