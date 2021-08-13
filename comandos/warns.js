const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const ms = require("ms");
const reglas = require("./../resources/reglas.json");

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
      
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warns`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warns <@usuario || ID> \n▸ Ves cuántos warns tiene un usuario.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  let member = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0]);
  if(!message.member.roles.cache.find(x => x.id === staffRole.id) || !args[0]) {
    member = message.member;
  }
  if(!member) return message.channel.send({embeds: [embed]});
  
  let error = new Discord.MessageEmbed()
  .setColor(Colores.rojo)
  .setDescription(`Este usuario no tiene warns ningún tipo de warn.`);
  
  Warn.findOne({
    userID: member.id
  }, (err, warns) => {
    if(err) throw err;

      SoftWarn.findOne({
        userID: member.id
      }, (err2, soft) => {
        if(err2) throw err;

        if((!soft || soft.warns.length === 0) && (!warns || warns.warns < 0)){
          return message.channel.send({embeds: [error]})
        }

        let w;
        if(!warns){
          w = 0;
        } else {
          w = warns.warns;
        }

        let n;
        if(!soft){
          n = 0;
        } else {
          n = soft.warns.length;
        }

        let badguy = new Discord.MessageEmbed()
        .setAuthor(`| ${member.user.tag}'s warns`, member.user.displayAvatarURL())
        .setDescription(`**Número de warns ** ❛ \`${w}\` ❜
        **Número de Softwarns —** ❛ \`${n}\` ❜`)
        .setColor(Colores.verde);
        
        if (n != 0){
          let reglasArray = Object.values(reglas);
          for (let i = 0; i < n; i++){
          let index = reglasArray.indexOf(soft.warns[i].rule) + 1;
            badguy.addField(`${i+1} — ${soft.warns[i].rule} : Regla N°${index}`, `**— Nota: ${soft.warns[i].note}**`)
          }
        }

        return message.channel.send({embeds: [badguy]}).then(msg => {
          if(member == message.member){
            msg.delete({timeout: ms("10s")});
          }
        });
      })
      
  })

}

module.exports.help = {
    name: "warns"
}
