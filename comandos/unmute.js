const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const GlobalData = require("../modelos/globalData.js");

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);
  
  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    muteRole = guild.roles.cache.find(x => x.id === "544691532104728597");
    logC = guild.channels.cache.find(x => x.id === "483108734604804107");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}unmute`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}unmute <@usuario>`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
  if(!args[0]) return message.channel.send({embeds: [embed]});

  let mUser = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0]);
  
  let query = await GlobalData.findOne({
    "info.type": "roleDuration",
    "info.userID": mUser.id,
    "info.roleID": muteRole.id
  });

  if(query){ // eliminar el globaldata
    query.remove();
  }

  mUser.roles.remove(muteRole).then(x => message.react("✅"));
  
  let umEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Unmute`, author.displayAvatarURL())
  .setDescription(`**—** Usuario desmuteado: ${mUser}
**—** Mod: ${author}`)
  .setColor(Colores.verde);

  logC.send({embeds: [umEmbed]});

}

module.exports.help = {
    name: "unmute"
}
