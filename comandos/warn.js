const Config = require("./../base.json");
const Colores = require("./../colores.json");
const reglas = require("./../reglas.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return message.reply("comando en mantimiento joven.");

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);  
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warn`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warn <@usuario> <N° Regla> (nota adicional) \n▸ Warneas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);
    
      // Get the size of an object
      var size = Object.keys(reglas).length;

      let wUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
      if(!args[0]) return message.channel.send(embed);
      
      let rule = reglas[args[1]];
      if(!rule) return message.channel.send(rulesEmbed);

      let notes = args.join(" ").slice(args[0].length + args[1].length + 2) || "Recuerda leer siempre las reglas.";

      if(wUser.roles.cache.find(x => x.id === staffRole.id)){
        return message.reply("¿tas bobo o qué?");
      }
      
      let rulesEmbed = new Discord.MessageEmbed()
      .setColor(Colores.nocolor)
      .setDescription(`▸ Usa el comando como \`${prefix}warn ${wUser.id} <N° Regla>\`.`)
      .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}warn`);
      //agregar cada regla de la variable de reglas
      for(let i = 1; i <= size; i++){
          rulesEmbed.addField(reglas[i], `N° **${i}**`);
      }

      Warn.findOne({
        userID: wUser.id
      }, (err, warns) => {
        if(err) throw err;

         // confirmación madre mia
         let confirmation = new Discord.MessageEmbed()
         .setAuthor(`| Warn?`, guild.iconURL())
         .setDescription(`\`▸\` ¿Estás seguro de warnear a **${wUser.user.tag}**?
         \`▸\` Razón: Infringir la regla N°${args[1]} (${rule})`)
         .setColor(Colores.verde);
 
         message.channel.send(confirmation).then(msg => {
             msg.react(":allow:558084462232076312")
             .then(r => {
                 msg.react(":denegar:558084461686947891");
             });
 
             let cancelEmbed = new Discord.MessageEmbed()
               .setDescription(`Cancelado.`)
               .setColor(Colores.nocolor);
 
             const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
             const noFilter = (reaction, user) => reaction.emoji.id === "558084461686947891" && user.id === message.author.id;
 
             const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
             const no = msg.createReactionCollector(noFilter, { time: 60000 });
 
             yes.on("collect", r => {
              if(!warns){

                const newWarn = new Warn({
                  userID: wUser.id,
                  warns: 1
                })

                newWarn.save()
                .catch(e => console.log(e));
                  message.react("✅");

                let wEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                .setDescription(`**—** Warneado: **${wUser}**.
      **—** Canal: **${message.channel}**.
      **—** Warns actuales: **1**.
      **—** Por infringir la regla: **${rule}**.`)
                .setColor(Colores.rojo);

                logC.send(wEmbed);
                
                let warnedEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                .setDescription(`
      **—** Has sido __warneado__ por el STAFF.
      **—** Warns actuales: **${numWarns}**.
      **—** Por infringir la regla: **${rule}**.`)
                .setColor(Colores.rojo)
                .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                
                wUser.send(warnedEmbed)
                .catch(e => {
                  console.log('Tiene los MDs desactivados.')
                });

              } else {
                warns.warns = warns.warns + 1;
                warns.save()
                .catch(e => console.log(e));

                let wEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                .setDescription(`**—** Warneado: **${wUser}**.
      **—** Canal: **${message.channel}**.
      **—** Warns actuales: **${warns.warns}**.
      **—** Por infringir la regla: **${rule}**.`)
                .setColor(Colores.rojo);

                logC.send(wEmbed);
                
                /*if(warns.warns === 2){
                  let infoEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1")
                .setDescription(`**—** ${wUser.user.tag}, este es tu **warn número ❛ \`2\` ❜**
      *— ¿Qué impacto tendrá este warn?*
      **—** Tranquilo. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
      **—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`${prefix}shop items\` para más info de precios, etc. )*`)
                .setColor(Colores.rojo);
                  
                  wUser.send(infoEmbed);
                } else

                if(warns.warns == 3){
                  let autoMod = new Discord.MessageEmbed()
                  .setAuthor(`| TempBan`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
                  .setDescription(`**—** Ban (24h): **${wUser}**.
        **—** Warns actuales: **${warns.warns}**.
        **—** Warn por última vez: **${numWarns}**.
        **—** Razón de ban (AutoMod): 3 warns acumulados.
        **—** Último warn por infringir la regla: **${rule}**.`)
                  .setColor(Colores.rojo);
                  

                  wUser.send(autoMod);
                  wUser.ban(`AutoMod. (Infringir "${rule}")`);
                  
                  setTimeout(function() {
                    guild.unban(wUser.id)
                  }, ms("1d"));
                  
                  logC.send(autoMod);
                } else

                if(warns.warns == 4){
                  let autoMod = new Discord.MessageEmbed()
                  .setAuthor(`| Ban PERMANENTE.`, "https://cdn.discordapp.com/emojis/537804262600867860.png")
                  .setDescription(`**—** Baneado: **${wUser}**.
        **—** Warns actuales: **${warns.warns}**.
        **—** Warn por última vez: **${numWarns}**.
        **—** Razón de ban (AutoMod): Muchos warns.
        **—** Último warn por infringir la regla: **${rule}**.`)
                  .setColor(Colores.rojo);

                  logC.send(autoMod);
                  wUser.send(autoMod)
                  wUser.ban(`AutoMod. (Infringir "${rule}")`);
                }*/
                
              message.react("✅")
                
                let warnedEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                .setDescription(`
      **—** Has sido __warneado__ por el STAFF.
      **—** Warns actuales: **${warns.warns}**.
      **—** Por infringir la regla: **${rule}**.
      **—** Notas / observaciones: **${notes}**.`)
                .setColor(Colores.rojo)
                .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                
                wUser.send(warnedEmbed)
                .catch(e => {
                  message.react("494267320097570837");
                  message.channel.send("¡Usuario con MDs desactivados! **¡No sabe cuántos WARNS tiene!**");
                });          
              }
             });

             no.on("collect", r => {
              return msg.edit(cancelEmbed).then(a => {
                msg.reactions.removeAll();
                message.delete();
                a.delete({timeout: ms("20s")});
              });
             })
          })
    })
}

module.exports.help = {
    name: "warn"
}
