const http = require("http");
const express = require("express");
const app = express();

app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const Config = require("./base.json");
const Rainbow = require("./rainbow.json");
const Colores = require("./colores.json");
const Emojis = require("./emojis.json");
const Discord = require("discord.js");
const anyBase = require("any-base");
const prettyms = require("pretty-ms");
const dec2hex = anyBase(anyBase.DEC, anyBase.HEX);
const bot = new Discord.Client({ disableMentions: "everyone" });
const fs = require("fs");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const logChannel = Config.logChannel;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const mainVip = Config.mainVip;
const botsChannel = Config.botsChannel;
const botsVip = Config.botsVip;
const staffComandos = Config.staffComandos;
const staffChat = Config.staffChat;

const commandsCooldown = new Set();
const jeffrosExpCooldown = new Set();
const repCool = new Set();
const workCooldown = new Set();

const coolded = new Map();
const active = new Map();
const disableEXPs = 0;

// WEAS PARA EVENTOS:

let multiplier = 1; // multiplicador de jeffros & exp

var cumplidos = [
  "Tifón",
  "Fiera",
  "Crack",
  "Bestia",
  "Máquina",
  "Jefe",
  "Número 1",
  "Figura",
  "Mostro",
  "Mastodonte",
  "Toro",
  "Furia",
  "Ciclón",
  "Tornado",
  "Artista",
  "Campeón",
  "Maestro",
  "Torero",
  "Socio",
  "Capo",
  "McQueen",
  "Volador",
  "Rapidín",
  "Rasputín",
  "USSR",
  "Bromas",
  "Bailador",
  "Montros",
  "Moletres",
  "Cáscaras",
  "Jubilado",
  "EA SPORTS"
];

var easterImg = [
  "https://i.kym-cdn.com/entries/icons/facebook/000/015/559/It_Was_Me__Dio!.jpg"
];

// ############################

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Jeffros = require("./modelos/jeffros.js");
const Commands = require("./modelos/tvCommands.js");
const Exp = require("./modelos/exp.js");
const Cuenta = require("./modelos/cuenta.js");
const AutoRole = require("./modelos/autorole.js");
const Dark = require("./modelos/globalDark.js");

/* ##### MONGOOSE ######## */

bot.comandos = new Discord.Collection();

fs.readdir("./comandos/", (err, files) => {
  if (err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("No hay comandos.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./comandos/${f}`);
    bot.comandos.set(props.help.name, props);
    bot.comandos.set(props.help.alias, props);
  });
});

/* ############################ LOGGER ################################ */

const lEvents = {
  READY: "",
  RESUMED: "",
  GUILD_CREATE: "",
  GUILD_DELETE: "",
  MESSAGE_DELETE: "",
  MESSAGE_CREATE: "",
  MESSAGE_UPDATE: "",
  PRESENCE_UPDATE: "",
  TYPING_START: "",
  GUILD_MEMBER_UPDATE: "",
  VOICE_SERVER_UPDATE: "",
  VOICE_STATE_UPDATE: "",
  null: "",
  MESSAGE_REACTION_ADD: "",
  MESSAGE_REACTION_REMOVE: "",
  MESSAGE_REACTION_REMOVE_ALL: ""
};

const lKeys = {
  name: "Nombre",
  icon_hash: "Icono",
  splash_hash: "Imagen splash de invitación",
  owner_id: "Owner",
  region: "Región",
  afk_channel_id: "Canal AFK",
  afk_timeout: "Tiempo para AFK",
  mfa_level: "Requisitos 2FA",
  verification_level: "Nivel de verificación",
  explicit_content_filter: "Mensajes escaneados para miembros",
  default_message_notifications: "Notificación de mensajes predeterminada",
  vanity_url_code: "Invitación para el servidor",
  $add: "Nuevo role",
  $remove: "Role eliminado",
  prune_delete_days: "Días de purga",
  widget_enabled: "Widget del server",
  widget_channel_id: "ID del Canal del widget",
  position: "Posición",
  topic: "Tema",
  bitrate: "Bitrate",
  permission_overwrites: "Permisos",
  nsfw: "NSFW",
  application_id: "ID de aplicación",
  rate_limit_per_user: "Cooldown",
  permissions: "Permisos",
  color: "Color",
  hoist: "Separación",
  mentionable: "Mencionable",
  allow: "Permitido",
  deny: "Denegado",
  code: "Código",
  channel_id: "ID del canal",
  inviter_id: "Creador",
  max_uses: "Máximo de usos",
  temporary: "Temporal",
  nick: "Apodo cambiado",
  id: "ID",
  type: "Tipo"
};

bot.on("raw", async event => {
  if (lEvents.hasOwnProperty(event.t)) return;
  
  console.log("EVENTO:");
  console.log(event);
  const guild = bot.guilds.cache.get("447797737216278528");
  const log = guild.channels.cache.get(logChannel);
  let e = guild.fetchAuditLogs().then(audit => {
    const entry = audit.entries.first();

    if (!entry.changes) return;

    const changes = entry.changes[0];
    const key = lKeys[changes.key];
    let oldKey = changes.old;
    let newKey = changes.new;
    const executor = entry.executor;

    

    let embed = new Discord.MessageEmbed();
    let keys = getChanges(changes); 

      switch (event.t) {
        case "GUILD_UPDATE":
          if (!lKeys.hasOwnProperty(entry.changes[0].key)) return;

          embed.setAuthor(`— Se ha actualizado el servidor`, guild.iconURL());
          embed.setColor(Colores.verde);
          embed.setFooter(
            `Cambio por ${executor.tag}`,
            executor.displayAvatarURL()
          );
          embed.setTimestamp();

          if (entry.changes.length > 1) {
            for (let i = 0; i < entry.changes.length; i++) {
              keys = getChanges(entry.changes[i]);

              console.log(keys);

              embed.addField(
                `— ${lKeys[entry.changes[i].key]}`,
                `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
              );
            }
          } else {
            embed.addField(
              `— ${key}`,
              `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
            );
          }

          log.send(embed);
          break;

        case "CHANNEL_CREATE":
          if (!lKeys.hasOwnProperty(entry.changes[0].key)) return;

          embed.setAuthor(`— Se ha creado un canal`, guild.iconURL());
          embed.setColor(Colores.verde);
          embed.setDescription(`**— ${
            entry.target.type === "text" ? "Texto" : "Voz"
          }**
**—** Nombre: **${entry.target.name}**.
**—** ID: **${entry.target.id}**.`);
          embed.setFooter(
            `Creado por ${executor.tag}`,
            executor.displayAvatarURL()
          );
          embed.setTimestamp();

          log.send(embed);
          break;

        case "CHANNEL_DELETE":
          if (!lKeys.hasOwnProperty(entry.changes[0].key)) return;

          embed.setAuthor(`— Se ha eliminado un canal`, guild.iconURL());
          embed.setColor(Colores.verde);
          embed.setDescription(`**— ${
            entry.changes[1].old === 0 ? "Texto" : "Voz"
          }**
**—** Nombre: **${entry.changes[0].old}**.
**—** ID: **${entry.target.id}**.`);
          embed.setFooter(
            `Eliminado por ${executor.tag}`,
            executor.displayAvatarURL()
          );
          embed.setTimestamp();

          log.send(embed);
          break;

        case "CHANNEL_UPDATE":
          if (!lKeys.hasOwnProperty(entry.changes[0].key)) return;

          if(entry.action != event.t){

            if(entry.action === "CHANNEL_OVERWRITE_UPDATE"){

              console.log("SE HAN ACTUALIZADO PERMISOS EN UN CANAL");
              
              console.log("EVENT.D:");
              console.log(event.d);
              
              console.log("keys:");
              console.log(keys);

              embed.setAuthor(`— Se han actualizado los permisos de una canal`, guild.iconURL());
              embed.setColor(Colores.verde);
              embed.setFooter(
                `Actualizado por ${executor.tag}`,
                executor.displayAvatarURL()
              );
              embed.setTimestamp();

            }

          }

          embed.setAuthor(`— Se ha actualizado un canal`, guild.iconURL());
          embed.setColor(Colores.verde);
          embed.setFooter(
            `Eliminado por ${executor.tag}`,
            executor.displayAvatarURL()
          );
          embed.setTimestamp();

          if (entry.changes.length > 1) {
            for (let i = 0; i < entry.changes.length; i++) {
              let keys = getChanges(entry.changes[i]);
              embed.addField(
                `— ${lKeys[entry.changes[i].key]}`,
                `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
              );
            }
          } else {
            embed.addField(
              `— ${key}`,
              `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
            );
          }

          log.send(embed);
          break;

        case "CHANNEL_OVERWRITE_CREATE":
          if (!lKeys.hasOwnProperty(entry.changes[0].key)) return;

          embed.setAuthor(`— Se han creado permisos un canal`, guild.iconURL());
          embed.setColor(Colores.verde);
          embed.setDescription(`**— ${
            entry.target.type === "text" ? "Texto" : "Voz"
          }**
**—** Nombre: **${entry.target.name}**.
**—** ID: **${entry.target.id}**.`);
          embed.setFooter(
            `Creado por ${executor.tag}`,
            executor.displayAvatarURL()
          );
          embed.setTimestamp();

          log.send(embed);
          break;
      }
  });
});

bot.on("channelUpdate", (oldChannel, newChannel) => {
 // if (!lKeys.hasOwnProperty(newChannel.changes[0].key)) return;
  
  const guild = bot.guilds.cache.get("447797737216278528");
  const log = guild.channels.cache.get(logChannel);
  let embed = new Discord.MessageEmbed();

  let e = guild.fetchAuditLogs().then(audit => {
    const entry = audit.entries.first();
    const executor = entry.executor;

    function getChanges(entryChanges) {
      switch (entryChanges.key) {
        case "afk_timeout":
          oldKey = `**${entryChanges.old / 60}** minutos`;
          newKey = `**${entryChanges.new / 60}** minutos`;

          break;

        case "mfa_level":
          oldKey = entryChanges.old ? "**Sí**" : "**No**";
          newKey = entryChanges.new ? "**Sí**" : "**No**";
          break;

        case "verification_level":
          oldKey = `Nivel **${entryChanges.old}**`;
          newKey = `Nivel **${entryChanges.new}**`;
          break;

        case "explicit_content_filter":
          oldKey = `Nivel **${entryChanges.old + 1}**`;
          newKey = `Nivel **${entryChanges.new + 1}**`;
          break;

        case "default_message_notifications":
          oldKey =
            entryChanges.old === 1
              ? `**Sólo menciones**`
              : `**Todos los mensajes**`;
          newKey =
            entryChanges.new === 1
              ? `**Sólo menciones**`
              : `**Todos los mensajes**`;
          break;

        case "prune_delete_days":
          oldKey = `**${entryChanges.old}** días`;
          newKey = `**${entryChanges.new}** días`;
          break;

        case "afk_channel_id":
          oldKey = guild.channels.cache.get(entryChanges.old)
            ? `**${guild.channels.cache.get(entryChanges.old)}**`
            : "**Nulo**";
          newKey = guild.channels.cache.get(entryChanges.new)
            ? `**${guild.channels.cache.get(entryChanges.new)}**`
            : "**Nulo**";
          break;

        case "owner_id":
          oldKey = guild.members.cache.get(entryChanges.old)
            ? `**${guild.members.cache.get(entryChanges.old)}**`
            : "**Nulo**";
          newKey = guild.members.cache.get(entryChanges.new)
            ? `**${guild.members.cache.get(entryChanges.new)}**`
            : "**Nulo**";
          break;

        case "rate_limit_per_user":
          oldKey = entryChanges.old
            ? `**${entryChanges.old}** segundos`
            : "**Nulo**";
          newKey = entryChanges.new
            ? `**${entryChanges.new}** segundos`
            : "**Nulo**";
          break;

        default:
          oldKey = "**" + entryChanges.old + "**" || "**Nulo**";
          newKey = "**" + entryChanges.new + "**" || "**Nulo**";
      }
      return { old: oldKey, new: newKey };
    }

    if(oldChannel.permissionOverwrites != newChannel.permissionOverwrites){

      console.log("SE HAN ACTUALIZADO PERMISOS EN UN CANAL");
      
      console.log(oldChannel.permissionOverwrites)
      console.log(newChannel.permissionOverwrites)

      embed.setAuthor(`— Se han actualizado los permisos de una canal`, guild.iconURL());
      embed.setColor(Colores.verde);
      embed.setFooter(
        `Actualizado por ${executor.tag}`,
        executor.displayAvatarURL()
      );
      embed.setTimestamp();

    }


  embed.setAuthor(`— Se ha actualizado un canal`, guild.iconURL());
  embed.setColor(Colores.verde);
  embed.setFooter(
    `Eliminado por ${executor.tag}`,
    executor.displayAvatarURL()
  );
  embed.setTimestamp();

  if (entry.changes.length > 1) {
    for (let i = 0; i < entry.changes.length; i++) {
      let keys = getChanges(entry.changes[i]);
      embed.addField(
        `— ${lKeys[entry.changes[i].key]}`,
        `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
      );
    }
  } else {
    embed.addField(
      `— ${key}`,
      `**—** Ahora: ${keys.new}.\n**—** Antes: ${keys.old}.`
    );
  }

  log.send(embed);
})

})

/*bot.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author.bot) return;
  if(oldMessage.content === newMessage.content) return;
  if (!oldMessage.content) oldMessage.content = "_ _";
  if (!newMessage.content) newMessage.content = "_ _";

  let l = bot.guilds.cache
    .get(jgServer)
    .channels.find(x => x.id === Config.logChannel);
  let embed = new Discord.MessageEmbed()
    .setAuthor(`— Han actualizado un mensaje`, newMessage.guild.iconURL())
    .setDescription(
      `**—** Cambios a un mensaje en ${newMessage.channel}
**—** Mensaje nuevo: \`${newMessage.content}\`
**—** Mensaje viejo: \`${oldMessage.content}\`
**—** ID: \`${newMessage.id}\`.`
    )
    .setColor(Colores.verde)
    .setFooter(
      `— Actualizado por ${newMessage.author.tag}`,
      newMessage.author.displayAvatarURL()
    )
    .setTimestamp();

  l.send(embed);
});

bot.on("messageDelete", async message => {
  if (message.author.bot) return;
  if (!message.content) message.content = "_ _";
  let user;
  const entry = await message.guild
    .fetchAuditLogs({ type: "MESSAGE_DELETE" })
    .then(audit => audit.entries.first());
  if (
    entry.extra.channel.id === message.channel.id &&
    entry.target.id === message.author.id &&
    (entry.createdTimestamp > Date.now() - 5000 && entry.extra.count >= 1)
  ) {
    user = entry.executor;
  } else {
    user = message.author;
  }
  let l = bot.guilds.cache
    .get(jgServer)
    .channels.find(x => x.id === Config.logChannel);
  console.log(message);
  let embed = new Discord.MessageEmbed()
    .setAuthor(`— Se ha eliminado un mensaje`, message.guild.iconURL())
    .setDescription(
      `**—** Mensaje eliminado: \`${message.content}\`.
**—** ID: \`${message.id}\`.`
    )
    .setColor(Colores.verde)
    .setFooter(`— Eliminado por ${user.tag}`, user.displayAvatarURL())
    .setTimestamp();

  l.send(embed);
});

/* ############################ LOGGER ################################ */

bot.on("guildMemberRemove", member => {
  let channel = member.guild.channels.cache.find(x => x.id === mainChannel);
  let logC = member.guild.channels.cache.find(x => x.id === logChannel);
  let tag = member.user.tag;
  let despedidas = [
    `¡**${tag}** se ha ido a un lugar mejor...! A su casa.`,
    `**${tag}** se ha aburrido de tantos @everyones`,
    `Nos falta algo... ¿**${tag}**? ¿A dónde te has ido...?`,
    `Las rosas son rojas, las violetas azules, **${tag}** se ha llevado la pizza, que bueno que era de piña.`,
    `**${tag}** se ha llevado la pizza.`,
    `**${tag}** stay determined...!`,
    `¿**${tag}** es hater..?`,
    `**${tag}** no nos hagas un vídeo de 40 minutos...`,
    `A **${tag}** no le dieron Mod...`,
    `**${tag}** no seas malo`
  ];

  if (member.user.bot) return;

  const fBye = despedidas[Math.floor(Math.random() * despedidas.length)];
  let embed = new Discord.MessageEmbed()
    .setDescription(fBye)
    .setColor("#66a0ff");

  bot.user.setActivity(`${prefix}ayuda - ${bot.users.cache.size} usuarios🔎`);
  return channel.send(embed).then(msg => {
    msg.react(member.guild.emojis.cache.get("524673704655847427"));
  });
});

bot.on("guildMemberAdd", member => {
  let channel = member.guild.channels.cache.find(x => x.id === mainChannel);
  let tag = member.user.tag;
  let reglasC = member.guild.channels.cache.find(
    x => x.id === Config.rulesChannel
  );
  let infoC = member.guild.channels.cache.find(
    x => x.id === Config.infoChannel
  );

  if (member.user.bot) {
    return member.roles.add("447821238631530498");
  } else {
    member.roles.add("460966148704436235");
  }

  let bienvenidas = [
    `Bienvenid@ a \`${member.guild.name}\`, **${tag}**. Pásate por ${reglasC} y ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
    `¡Hola, **${tag}**! Muchas gracias por unirte a \`${member.guild.name}\`, ve a los canales: ${reglasC} y ${infoC} para evitar inconvenientes, y ¡pásala bien!`
  ];

  let fBienv = bienvenidas[Math.floor(Math.random() * bienvenidas.length)];

  if (member.user.id === "373901344995803138") {
    // si el usuario es ares
    fBienv = `hola, **${tag}**. bienvenido, otra vez.`;
  }

  let embed = new Discord.MessageEmbed()
    .setDescription(fBienv)
    .setColor(Colores.verde);

  member.send(embed).catch(e => {
    channel.send(embed);
  });

  bot.user.setActivity(`${prefix}ayuda - ${bot.users.cache.size} usuarios🔎`);
});

bot.on("ready", async () => {
  console.log(`${bot.user.username} ONLINE`);
  bot.user.setActivity(`${prefix}ayuda - ${bot.users.cache.size} usuarios🔎`);

  let channel = bot.channels.cache.get(logChannel);
  channel.send("Reviví.");

  // inflacion DARKSHOP

  Dark.findOne({

  }, (err, dark) => {
    if(err) throw err;

    inflation = Number(Math.random() * 10).toFixed(2);
    if(Number(inflation) < 1) inflation = Number(inflation) + 1;
    date = new Date() // hoy
    duration = Math.floor(Math.random() * 30); // duración máxima 30 días.

    if(!dark){
      console.log(inflation, date, duration);

      const newInflation = new Dark({
        oldinflation: 1,
        inflation: inflation,
        since: date,
        duration: duration
      });

      newInflation.save();
    } else {
      // leer y cambiar si es necesario

      let oldDate = new Date(dark.since);
      let newDate = new Date()

      let diference1 = newDate.getTime() - oldDate.getTime();
      let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

      if(pastDays >= dark.duration){
        console.log(inflation, date, duration);

        dark.oldinflation = dark.inflation;
        dark.since = date;
        dark.duration = duration;
        dark.inflation = inflation;

        dark.save();
      }
    }
  })

});

//main
bot.on("message", async message => {
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  let guild = message.guild;
  let author = message.author;

  const cmdCooldown = 5;
  let jexpCooldown = 60;
  const repCooldown = 86400;

  // Captcha.
  if (message.author.bot) return;
  if (message.channel.type == "dm") return;
  if (message.content.startsWith(prefix)) {
    // Si el mensaje empieza por el prefijo, entonces...

    let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
    let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
    let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

    // COOLDOWN COMANDOS

    if (!message.content.startsWith(prefix)) return;

    if (message.channel.id === botsChannel) {
    } else if (message.channel.id === staffComandos) {
    } else if (message.channel.id === botsVip) {
    }/* else if (message.channel.id === offtopicChannel) {
    }*/ else if (message.content.startsWith(prefix + "clear")) {
    } else if (message.content.startsWith(`${prefix}encuesta`)) {
    } else if (message.content.startsWith(`${prefix}poll`)) {
    } else if (message.member.roles.cache.find(x => x.id === staffRole.id)) {
    } else if (message.author.id === jeffreygID || message.author.id === "460913577105293313") {
    } else {
      return;
    }

    // /rep @usuario
    if (message.content.startsWith(`${prefix}rep`)) {
      // if(author.id != jeffreygID) return message.reply(`Este comando está en mantenimiento! Pronto estará disponible. Disculpa los inconvenientes.`);
      let jeffreyRole = guild.roles.cache.find(
        x => x.id === Config.jeffreyRole
      );
      let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
      let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
      let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
      let uPrest = guild.member(
        message.mentions.users.first() ||
          message.guild.members.cache.get(args[0])
      );
      let logC = guild.channels.cache.find(x => x.id === logChannel);

      let embed = new Discord.MessageEmbed()
        .setTitle(`Ayuda: ${prefix}rep`)
        .setColor(Colores.nocolor)
        .setDescription(
          `▸ El uso correcto es: ${prefix}rep <@usuario>\n▸ Le das un punto de reputación a un usuario.`
        )
        .setFooter(`<> Obligatorio () Opcional`);

      if (!uPrest) return message.channel.send(embed);

      Exp.findOne(
        {
          serverID: guild.id,
          userID: uPrest.user.id
        },
        (err, pres) => {
          if (err) throw err;

          if (!pres) {
            return message.reply(
              `No pude encontrar a este usuario. O simplemente no ha hablado.`
            );
          } else {
            let corEmbed = new Discord.MessageEmbed()
              .setAuthor(`| Rep`, `${uPrest.user.displayAvatarURL()}`)
              .setDescription(
                `**—** Usuario: **${uPrest}**.
**—** Por: **${message.author.username}**.
**—** En: **${message.channel}**.
**—** Reputación actual: **${pres.reputacion + 1}**.`
              )
              .setColor(Colores.verde);

            if (uPrest.user.id === author.id) {
              return message.reply(
                `No puedes darte un punto de reputación a ti mismo.`
              );
            } else {
              if (repCool.has(message.author.id))
                return message.reply(
                  `Sólo puedes usar este comando cada 24 horas.`
                );

              pres.reputacion = pres.reputacion + 1;
              pres.save().catch(err => console.log(err));

              repCool.add(message.author.id);

              setTimeout(() => {
                repCool.delete(message.author.id);
              }, repCooldown * 1000);

              message
                .reply(
                  `¡Le has dado un punto de reputación a ${uPrest.user.tag}, deben de ser buenos! ^^`
                )
                .then(r => {
                  logC.send(corEmbed);
                });
            }
          }
        }
      );
    }

    let easter = chance.bool({ likelihood: 0.000001 });
    var randomCumplidos =
      cumplidos[Math.floor(Math.random() * cumplidos.length)];

    if (easter === true) {
      // (me cago en mi vida)
      randomCumplidos = `esta foto sale una vez en un millón, momento istorco. ${
        easterImg[Math.floor(Math.random() * easterImg.length)]
      }`;
    }

    if (commandsCooldown.has(author.id)) {
      message.delete();
      return message.reply(
        `Relájate un poco con los comandos, ${randomCumplidos}.`
      );
    }

    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) {
      commandsCooldown.add(author.id);
    }

    setTimeout(() => {
      commandsCooldown.delete(author.id);
    }, cmdCooldown * 1000);

    let commandFile = bot.comandos.get(cmd.slice(prefix.length));
    if (commandFile) commandFile.run(bot, message, args, active);

    if (message.content === `${prefix}coins`) {
      //if(message.author.id != jeffreygID) return message.reply("Comando en mantenimiento, vuelve más tarde!");
      let money = Math.ceil(Math.random() * 20);
      let tmoney = `**${Emojis.Jeffros}${money}**`;
      let randommember = guild.members.cache.random();
      randommember = `**${randommember.user.tag}**`;
      if (multiplier != 1) {
        money = money * multiplier;
        tmoney = `**${Emojis.Jeffros}${money}**`;
      }

      let responses = [
        `Te ofreces para dar clases particulares a domicilio, terminas con intenciones suicidas pero ganas ${tmoney}`, //1
        `Hoy te flipas en la oficina y te dan ${tmoney}`, //2
        `Repartes el periódico por tu barrio, ganas ${tmoney}`,
        `Le haces un dibujo a ${randommember} y te paga ${tmoney}`,
        `Te patrocina una marca reconocida y te dan ${tmoney}`,
        `Te vuelves youtuber y te dan ${tmoney}`,
        `${randommember} te da ${tmoney} por cambiar de puesto en el McDonalds`,
        `Vas a buscar trabajo en el estadero de la esquina, la señora que atiende te escupe en la cara pero aun así te dan ${tmoney}`, // AlagX#5391 - No 1 ---- 8
        `Buscas trabajo en McDonalds pero acabas en Burger King, no sabes como paso pero te dan ${tmoney}`, // BokaShoTeAmo#5512 - No 1
        `${randommember} te regaló un bono de diez mil dólares y al recibir el pago viste que tenías ${tmoney}.`, // FraZ#4046 - No 1
        `Te vuelves streamer y eres muy popular, luego tu canal muere, aún así recibes ${tmoney}`, // AlagX#5391 - No 2
        `En tu celular cargas 10$ de Saldo pero al ver tu Saldo actual, miras que no recargo nada y tenés ${tmoney}`, // FraZ#4046 - No 2
        `Compraste una mansion por 1 millon de dolares, pero al final se quedaron con tu dinero, les reclamas pero no te lo devuelven todo, te dan ${tmoney}`, //BokaShoTeAmo#5512 - No 2
        `Te compras un mueble pero viene todo roto, reclamas y te dan ${tmoney}`, // jųæņđłø#7339 - No 1
        `Pasas de hacer streams en Twitch a Mixer, la gente te odia pero aún así te dan ${tmoney} por esto`, // AlagX#5391 - No 3
        `Atracas un banco, corres lo más rápido que puedes y logras escapar de la policía, luego te das cuenta que se te cayó parte del dinero y te quedas con ${tmoney}`, // AlagX#5391 - No 4
        `Vendes un juego en G2A para tu saldo de PayPal, pero al revisarlo, solo te llega ${tmoney}`, // 4K#1583 - No 1
        `Trabajas en un puesto de comida rápida, un cliente se queja de su comida por su desagradable textura, pero aún así te dio ${tmoney}`, // 4K#1583 - No 2
        `Intentas piratear una pelicula y terminas hackeado, ves tu PayPal y tienes ${tmoney}`, // juandlo#7339 - No 2
        `Trabajas en una empresa de PCs en el primer dia te corren pero te dan ${tmoney}`, // Shya#5512 - No 3
        `Gastas medio millón de dólares en cierto juego que empieza por F, pero pierdes todo tu dinero, aún así logras trabajar de conserje en cierta compañía que empieza por E y te dan ${tmoney}`, // Hat Kid#5391 - No 5
        `Participas en un torneo de GH3, llegas sin dedos a tu hogar pero aún sientes que valió la pena, recibes ${tmoney}`, // 4KK#1583 - No 2
        `Haces varias plegarias hacia al cielo y de él te caen ${tmoney} y algún que otro rayo`, // Hat Kid#5391 - No 6
        `Trabajas de conserje en una compañía multimillonaria y te dan ${tmoney}`, // Hat Kid#5391 - No 7
        `Trabajas en una pizzería con animatrónicos supuestamente embrujada, logras sobrevivir y los dueños te pagan ${tmoney}`, // Hat Kid#5391 - No 8
        `Trabajas de cirujano y aunque te de algo de asco te dan ${tmoney}`, // juandlo#7339 - No 3
        `Trabajas como programador y haces un gran juego, ganas ${tmoney}`, // El Faw que ahora es Blixer#9125 - No 1
        `Creas tu propio estudio indie y creas un videojuego pero la gente piratea tu juego y solo consigues ${tmoney}`, // Hat Kid#5391 - No 9
        `MrBeast te regala ${tmoney} mientras te comes una pizza`,
        `Participas en un sorteo. No ganas nada pero te encuentras ${tmoney} cuando sales de casa`,
        `Le copias una canción a un artista, logras sacar ${tmoney} antes de que te detecte el copyright`,
        `Te cuelgas de la fama de ${randommember} y logras sacar ${tmoney} con el clickbait`
      ];

      let text = responses[Math.floor(Math.random() * responses.length)];

      let embed = new Discord.MessageEmbed()
        .setColor(Colores.rojo)
        .setDescription(text);

      Jeffros.findOne(
        {
          serverID: guild.id,
          userID: author.id
        },
        (err, jeffros) => {
          if (err) throw err;

          setTimeout(() => {
            coolded.delete(author.id)
            workCooldown.delete(message.author.id);
          }, ms("10m"));

          if (workCooldown.has(message.author.id)){
            let timer = coolded.get(author.id)
            let left = prettyms((ms("10m")) - (new Date().getTime() - timer), {secondsDecimalDigits: 0 });
            return message.reply(
              `Usa este comando en ${left}, ${randomCumplidos}`
            );
          }

          workCooldown.add(message.author.id);
          let timeMS = new Date().getTime();
          coolded.set(author.id, timeMS);

          if (!jeffros) {
            const newJeffros = new Jeffros({
              userID: author.id,
              serverID: message.guild.id,
              jeffros: money
            });

            newJeffros.save();
          } else {
            jeffros.jeffros += money;
            jeffros.save();
          }


          message.channel.send(embed);
        }
      );
    }
  } else {
    // JEFFREY ASSISTANT

    if (
      message.content
        .toLowerCase()
        .startsWith("hey,", "ey,", "eu, ", "bot,", "hey bot,")
    ) {
      // entrenamiento

      return;
    }

    if (message.member.roles.cache.find(x => x.id === Config.lvl40)){
      jexpCooldown = jexpCooldown / 2;
    }
    

    // ############################ CREACION DEL PERFIL ###################################
    Cuenta.findOne(
      {
        userID: author.id
      },
      (err, cuenta) => {
        if (err) throw err;

        if (!cuenta) {
          const newCuenta = new Cuenta({
            userID: author.id,
            discordname: author.username,
            username: "N/A",
            realname: author.username,
            bio: "N/A",
            age: "N/A",
            sex: "N/A",
            hex: "N/A",
            birthd: "N/A",
            birthy: "N/A",
            bdString: "N/A",
            bdMonthString: "N/A",
            bdDayString: "N/A",
            seenBy: 0
          });

          if (message.channel.id != mainChannel) return;
          newCuenta
            .save()
            .then(() => {
              console.log(`Cuenta creada para ${author.username}`);
            })
            .catch(err => console.log(err));
        } else {
        }
      }
    );

    // ################################# JEFFROS ################################
    
    if(author.id == jeffreygID || disableEXPs != 1){
    let jeffrosToAdd = Math.ceil(Math.random() * 5);

    // VIP 200%
    if (message.member.roles.cache.find(x => x.id === "529275759521431553")) {
      jeffrosToAdd = Math.ceil(Math.random() * ((10 / 100) * 200));
    }

    // NIVEL 10 115%

    if (message.member.roles.cache.find(x => x.id === Config.lvl10)) {
      jeffrosToAdd = Math.ceil(Math.random() * ((10 / 100) * 115));
    }

    if (multiplier != 1) {
      jeffrosToAdd = jeffrosToAdd * multiplier;
    }

    Jeffros.findOne(
      {
        userID: author.id,
        serverID: message.guild.id
      },
      (err, jeffros) => {
        if (err) console.log(err);

        if (jeffrosExpCooldown.has(author.id)) {
          return;
        }

        if (message.channel.id != mainChannel && message.channel.id != mainVip)
          return;
        console.log(jeffrosToAdd + " Jeffros");

        if (!jeffros) {
          // Si el usuario no tiene Jeffros
          const newJeffros = new Jeffros({
            userID: author.id,
            serverID: message.guild.id,
            jeffros: jeffrosToAdd
          });

          newJeffros.save().catch(err => console.log(err));
        } else {
          // Si el usuario ya tiene Jeffros

          jeffros.jeffros = jeffros.jeffros + jeffrosToAdd;
          jeffros.save().catch(err => console.log(err));
        }

        // ################################# E X P ################################

        let expToAdd = Math.ceil(Math.random() * 5);

        // VIP 200%
        if (message.member.roles.cache.find(x => x.id === "529275759521431553")) {
          expToAdd = Math.ceil(Math.random() * ((10 / 100) * 200));
        }

        // NIVEL 10 115%

        if (message.member.roles.cache.find(x => x.id === Config.lvl10)) {
          expToAdd = Math.ceil(Math.random() * ((10 / 100) * 115));
        }

        if (multiplier != 1) {
          expToAdd = expToAdd * multiplier;
        }

        Exp.findOne(
          {
            userID: author.id,
            serverID: message.guild.id
          },
          (err, uExp) => {
            if (err) throw err;

            if (jeffrosExpCooldown.has(author.id))
              return;

            if (message.channel.id != mainChannel && message.channel.id != mainVip)
              return;
            console.log(expToAdd + " experiencia");

            if (!uExp) {
              // Si el usuario no tiene Experiencia

              Exp.countDocuments({}, function(err, count) {
                const newExp = new Exp({
                  userID: author.id,
                  username: author.username,
                  serverID: guild.id,
                  exp: expToAdd,
                  level: 0,
                  reputacion: 1
                });

                newExp.save().catch(err => console.log(err));
              });
            } else {
              // Si el usuario ya tiene Experiencia

              let curLvl = uExp.level;
              let nxtLvl = uExp.level * 300 + (uExp.level * 5);
              let curExp = uExp.exp;

              if (uExp.level === 0) {
                // Si el nivel del usuario a penas es 0, para subir de nivel deberá tener 100 de exp.
                nxtLvl = 100;
              }

              uExp.exp = uExp.exp + expToAdd;

              if (nxtLvl <= uExp.exp) {
                uExp.level = uExp.level + 1;

                console.log(`${author.username} sube de nivel! (${curLvl + 1})`);

                if (uExp.level === 1) {
                  message.channel.send(`**${author} empieza a mostrarse, ¿será el inicio de algo grande?.\n— ¡SUBE A NIVEL 1!**`)
                  message.member.roles.add(Config.lvl1);
                } else if (uExp.level === 10) {
                  message.channel.send(`**${author} no piensa rendirse.\n— ¡SUBE A NIVEL 10!**`)
                  message.member.roles.add(Config.lvl10);
                } else if (uExp.level === 20) {
                  message.channel.send(`**${author} ¿estás determinado?.\n— ¡SUBE A NIVEL 20!**`)
                  message.member.roles.add(Config.lvl20);
                } else if (uExp.level === 30) {
                  message.channel.send(`**${author} parece no detenerse.\n— ¡SUBE A NIVEL 30!**`)
                  message.member.roles.add(Config.lvl30);

                  // BONO DE 2000 POR LLEGAR AL LVL 30
                  Jeffros.findOne(
                    {
                      serverID: guild.id,
                      userID: author.id
                    },
                    (err, j) => {
                      j.jeffros = j.jeffros + 2000;

                      j.save();
                    }
                  );
                } else if (uExp.level === 40) {
                  message.channel.send(`**${author} casi logra llegar al punto medio.\n— ¡SUBE A NIVEL 40!**`)
                  message.member.roles.add(Config.lvl40);
                } else if (uExp.level === 50) {
                  message.channel.send(`**${author} está a mitad de camino.\n— ¡SUBE A NIVEL 50!**`)
                  message.member.roles.add(Config.lvl50);
                } else if (uExp.level === 60) {
                  message.channel.send(`**${author} no se rinde.\n— ¡SUBE A NIVEL 60!**`)
                  message.member.roles.add(Config.lvl60);
                } else if (uExp.level === 70) {
                  message.channel.send(`**${author} no va a parar.\n— ¡SUBE A NIVEL 70!**`)
                  message.member.roles.add(Config.lvl70);
                } else if (uExp.level === 80) {
                  message.channel.send(`**${author} no para de sorprendernos.\n— ¡SUBE A NIVEL 80!**`)
                  message.member.roles.add(Config.lvl80);
                } else if (uExp.level === 90) {
                  message.channel.send(`**${author} está en la recta final.\n— ¡SUBE A NIVEL 90!**`)
                  message.member.roles.add(Config.lvl90);
                } else if (uExp.level === 99) {
                  message.channel.send(`**${author} está a punto de logralo.\n— ¡SUBE A NIVEL 99!**`)
                  message.member.roles.add(Config.lvl99);
                  message.member.roles.add(Config.vipRole);
                } else if (uExp.level === 100) {
                  message.channel.send(`**${author} está determinado.\n— ¡SUBE A NIVEL 100!**`)
                  message.member.roles.add(Config.lvl100);
                }
              }

              uExp.save().catch(err => console.log(err));
            }

            jeffrosExpCooldown.add(author.id);

            setTimeout(() => {
              console.log(author.id + " ya puede ganar exp y jeffros")
              jeffrosExpCooldown.delete(author.id);
            }, jexpCooldown * 1000);
          }
        );
      }
    );
  } else {
    return console.log("A Y");
  }
  }
});

//Relleno y anti-antisistemas
/* ########### AUTOROLE ###################### */

const events = {
  MESSAGE_REACTION_ADD: "messageReactionAdd",
  MESSAGE_REACTION_REMOVE: "messageReactionRemove"
};

bot.on("raw", async event => {
  if (!events.hasOwnProperty(event.t)) return;

  const { d: data } = event;
  const user = bot.users.cache.get(data.user_id);
  const channel =
    bot.channels.cache.get(data.channel_id) || (await user.createDM());

  if (channel.messages.cache.has(data.message_id)) return;

  const message = await channel.messages.fetch(data.message_id);
  const emojiKey = data.emoji.id
    ? `${data.emoji.name}:${data.emoji.id}`
    : data.emoji.name;
  let reaction = message.reactions.cache.get(emojiKey);

  if (!reaction) {
    reaction = message.reactions.cache.get(data.emoji.id);
  }

  bot.emit(events[event.t], reaction, user);
});

bot.on("messageReactionAdd", (reaction, user) => {
  if (user.bot) return; // Si es un bot

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  AutoRole.findOne(
    {
      serverID: guild.id,
      channelID: channel.id,
      messageID: message.id,
      emoji: reaction.emoji.id || reaction.emoji.name
    },
    (err, msg) => {
      if (err) throw err;

      if (!msg) {
        return;
      } else {
        if (msg.custom === 1) {
          if (reaction.emoji.id === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.add(role);
          } else {
            return;
          }
        } else {
          if (reaction.emoji.name === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.add(role);
          } else {
            return;
          }
        }
      }
    }
  );
});

bot.on("messageReactionRemove", (reaction, user) => {
  if (user.bot) return; // Si es un bot

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  AutoRole.findOne(
    {
      serverID: guild.id,
      channelID: channel.id,
      messageID: message.id,
      emoji: reaction.emoji.id || reaction.emoji.name
    },
    (err, msg) => {
      if (err) throw err;

      if (!msg) {
        return;
      } else {
        if (msg.custom === 1) {
          if (reaction.emoji.id === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.remove(role);
          } else {
            return;
          }
        } else {
          if (reaction.emoji.name === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.remove(role);
          } else {
            return;
          }
        }
      }
    }
  );
});

// ####################### AWARDS

bot.on("messageReactionAdd", (reaction, user) => {
  if (user.bot) return; // Si es un bot

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  let silver = Config.silverAward;
  let gold = Config.goldAward;
  let platinium = Config.platiniumAward;
  let hallChannel = guild.channels.cache.find(x => x.id === Config.hallChannel);

  let bots = guild.channels.cache.find(x => x.id === Config.botsChannel);

  let award;
  let price;
  let gift;
  let contenido;
  let embed = new Discord.MessageEmbed();

  if (message.attachments.size !== 0) {
    // Attachments are present.
    const firstAttachment = message.attachments.first();

    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setImage(firstAttachment.url);
    embed.setDescription(`[★](${message.url}) ${message.content}`);
  } else if (message.embeds.length != 0) {
    let msgEmbed = message.embeds;

    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setDescription(`[★](${message.url}) ${msgEmbed[0].description}`);
  } else {
    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setDescription(`[★](${message.url}) ${message.content}`);
  }

  let paid = new Discord.MessageEmbed()
    .setDescription("Pagado.")
    .setColor(Colores.nocolor);

  switch (reaction.emoji.id) {
    case silver: // ################### PLATA ###########################
      award = "plata";
      price = 100;
      embed.setColor("#8f8f8f");
      embed.setFooter(`▸ Premio de plata por ${user.tag}`);
      embed.setTimestamp();
      break;

    case gold:
      award = "oro";
      price = 500;
      gift = 100;
      embed.setColor("#FFD700");
      embed.setFooter(`▸ Premio de oro por ${user.tag}`);
      embed.setTimestamp();
      break;

    case platinium:
      award = "platino";
      price = 1800;
      gift = 700;
      embed.setColor("#21ffe5");
      embed.setFooter(`▸ Premio de platino por ${user.tag}`);
      embed.setTimestamp();
      break;

    default:
      return;
  }

  let confirmation = new Discord.MessageEmbed()
    .setAuthor(`| Confirmación`, Config.jeffreyguildIcon)
    .setDescription(
      `**—** ${user.tag}, ¿Estás seguro de darle a este usuario el premio de **__${award}__**?
**—**( **${Emojis.Jeffros}${price}** )

*— Para más información de las recompensas de los premios [mira esto](https://discordapp.com/channels/447797737216278528/485191307346837507/668568017042538507).*`
    )
    .setColor(Colores.rojo);

  bots.send(`<@${user.id}>`).then(w => {
    w.delete();
    bots.send(confirmation).then(msg => {
      msg.react(":allow:558084462232076312").then(r => {
        msg.react(":denegar:558084461686947891");
      });

      let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.nocolor);

      const yesFilter = (reaction, userr) =>
        reaction.emoji.id === "558084462232076312" && userr.id === user.id;
      const noFilter = (reaction, userr) =>
        reaction.emoji.id === "558084461686947891" && userr.id === user.id;

      const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
      const no = msg.createReactionCollector(noFilter, {
        time: 60000
      });

      yes.on("end", r => {
        if (msg.reactions.length > 0) {
          message.channel.messages.fetch(message.id).then(m => {
            let react = m.reactions.get(
              reaction.emoji.name + ":" + reaction.emoji.id
            );

            react.remove(user.id);
          });

          msg.reactions.removeAll();
          return msg.edit(cancelEmbed).then(e => e.delete(10000));
        } else {
          return;
        }
      });

      yes.on("collect", r => {
        msg.reactions.removeAll();
        Jeffros.findOne(
          {
            serverID: guild.id,
            userID: user.id
          },
          (err, author) => {
            if (err) throw err;

            if (!author || author.jeffros < price) {
              return msg.edit({content: `No tienes **${Emojis.Jeffros}${price}**.`, embed: ""});
            }

            if (award === "oro" || award === "platino") {
              Jeffros.findOne(
                {
                  serverID: guild.id,
                  userID: message.author.id
                },
                (err, reciever) => {
                  if (err) throw err;

                  if (reciever === author) {
                    reciever.jeffros -= price - gift;

                    msg.edit(paid).then(m => {
                      m.delete(4000);
                    });
                    return hallChannel.send(embed);
                  }

                  if (!reciever) {
                    const newJeffros = new Jeffros({
                      userID: message.author.id,
                      serverID: guild.id,
                      jeffros: gift
                    });

                    newJeffros.save();
                    author.jeffros -= price;
                    author.save();

                    // despues del pago

                    msg.edit(paid).then(m => {
                      m.delete(4000);
                    });
                    return hallChannel.send(embed);
                  } else {
                    author.jeffros -= price;
                    author.save();
                    reciever.jeffros += gift;
                    reciever.save();

                    // despues del pago

                    msg.edit(paid).then(m => {
                      m.delete(4000);
                    });
                    return hallChannel.send(embed);
                  }
                }
              );
            } else {
              // SI EL PREMIO ES SILVER ENTONCES
              author.jeffros -= price;

              author.save();

              msg.edit(paid).then(m => {
                msg.reactions.removeAll();
                m.delete({ timeout: 4000 }); // no por favor
              });
              return hallChannel.send(embed);
            }
          }
        );
      });

      no.on("collect", r => {
        message.channel.messages.fetch(message.id).then(m => {
          let react = m.reactions.cache.get(reaction.emoji.id);

          react.users.remove(user.id);
        });

        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll();
          a.delete({ timeout: ms("10s") });
        });
      });
    });
  });
});

bot.on("message", async msg => {
  // Si mencionan a Jeffrey, mención en #log
  if (msg.author.bot) return;
  if (msg.channel.type == "dm") return;
  let contentMsg = msg.content.toLowerCase();
  let logC = msg.guild.channels.cache.find(x => x.id === logChannel);

  let adminRole = msg.guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = msg.guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = msg.guild.roles.cache.find(x => x.id === Config.staffRole);

  let embed = new Discord.MessageEmbed()
    .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL())
    .setDescription(
      `**__${msg.author.username}__** dice: "\`${msg.content}\`".`
    )
    .setFooter(`Mencionaron a Jeffrey.`, msg.guild.iconURL())
    .setColor(Colores.verde);

  if (
    contentMsg.includes("jeff") ||
    contentMsg.includes("jeffrey") ||
    contentMsg.includes("jeffry") ||
    contentMsg.includes("jefry") ||
    contentMsg.includes("jefri") ||
    contentMsg.includes("jeffri")
  ) {
    if (msg.author.bot) return;
    if (msg.author.id === jeffreygID) return;
    if (msg.content.startsWith(prefix)) return;
    if (msg.member.roles.cache.find(x => x.id === staffRole.id)) {
      return logC
        .send(`Un **STAFF** ha mencionado a Jeffrey en ${msg.channel}.`)
        .then(m => logC.send(embed));
    }
    return logC
      .send(`Han mencionado a <@!${jeffreygID}> en ${msg.channel}.`)
      .then(m => logC.send(embed));
  }
});

bot.on("message", async message => {
  // Cumpleaños
  if (message.author.bot) return;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  let guild = message.guild;
  let author = message.author;

  if (message.channel.id != mainChannel) return;

  Cuenta.findOne(
    {
      userID: author.id
    },
    (err, account) => {
      if (err) throw err;

      if (!account) return;

      if (account.bdString === "N/A") return;

      let dateString = account.bdString;
      let bdDay = account.bdDayString;
      let bdMonth = account.bdMonthString;
      let bdYear = account.birthy;

      var hoy = new Date();
      var userBD = new Date(dateString);

      if (hoy.getDate() === userBD.getDate()) {
        console.log(`DÍA EN COMÚN`);

        if (hoy.getMonth() === userBD.getMonth()) {
          console.log(`feliz cumpleaños, ${account.realname}.`);
          // give role

          if (message.member.roles.cache.find(x => x.id === Config.bdRole))
            return;
          let birthRole = guild.roles.cache.find(x => x.id === Config.bdRole);
          message.member.roles.add(birthRole);

          setTimeout(function() {
            message.member.roles.remove(birthRole);
          }, ms("1d"));

          // actualizar edad
          var edad = hoy.getFullYear() - userBD.getFullYear();
          console.log(`############### CUMPLEAÑOS: "${userBD}" ##############`);

          console.log(`############### EDAD: "${edad + 1}" ##############`);

          account.age = edad + 1;
          account.save().catch(e => console.log(e));

          message.guild.members.cache
            .get(message.author.id)
            .setNickname(`! ${message.author.username} ❮🎂❯`);
        } else {
          return console.log(`Pero mes no es común.`);
        }
      } else {
        return console.log(
          `${hoy.getDate()} no es igual a ${userBD.getDate()}...`
        );
      }
    }
  );
});

bot.on("message", message => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (!message.member) return;

  if (message.member.hasPermission("EMBED_LINKS")) {
    return;
  }

  if (message.content.includes("https://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("http://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("www.")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
});

bot.on("messageUpdate", message => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (message.channel.type === "dm") return;

  if (message.member.hasPermission("EMBED_LINKS")) {
    return;
  }

  if (message.content.includes("https://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("http://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("www.")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
});

// set message listener
bot.on("message", message => {
  if (
    message.content.startsWith(`${prefix}reset`) &&
    message.member.hasPermission("BAN_MEMBERS")
  ) {
    resetBot(message.channel);
  }
});

// Turn bot off (destroy), then turn it back on
function resetBot(channel) {
  // send channel a message that you're resetting bot [optional]
  channel
    .send("Reseteando...")
    .then(msg => bot.destroy())
    .then(() => bot.login(process.env.TOKEN))
    .then(() => channel.send("Reviví sin problemas."));
}

if (process.env.mantenimiento != 1) {
  bot.login(process.env.TOKEN);
} else {
  console.log("########## BOT EN MANTENIMIENTO, NO LOGEADO #############");
}



////////////////////////// ################# JEFFREY BOT . TV ###################################################################

const tmi = require('tmi.js');
const cooldowns = new Set();
const tvcooldown = new Map();

const client = new tmi.Client({
	options: { debug: true },
	connection: {
		secure: true,
		reconnect: true
	},
	identity: {
		username: 'jeffreybot_tv',
		password: 'oauth:z1d49zb1cw3e8vaqy5eoxdk13zg82l'
	},
	channels: [ 'jeffreyg_' ]
});

client.connect();

client.on('message', (channel, author, message, self) => {

  if(self) return;

  //console.log(message);

  let messageArray = message.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  let sender = author['display-name'];

  //comandos default
	switch(cmd){
    case `${Config.tvPrefix}comandos`:

      if(args[0] === "new"){

        let plus = 1;
        Commands.countDocuments({}, (err, c) => {
          Commands.findOne(
            {
              id: c + plus
            }, (err, found) => {
              if (err) throw err;

              if (!found) {
              } else {
                while (c + plus === found.id) {
                  c += plus + 1;
                  console.log("equal id");
                }
              }
            
              Commands.findOne({
                title: args[1]
              }, (err, command) => {
                if(err) throw err;

                if(!command){
                  const newCommand = new Commands({
                    title: args[1],
                    message: "na",
                    userLevel: "everyone",
                    cooldown: "5",
                    id: c + plus
                  });
    
                  newCommand.save();
    
                  return client.say(channel, `@${sender}, he creado un nuevo comando "${Config.tvPrefix}${args[1]}" (para configurar su comportamiento usa "${Config.tvPrefix}comandos edit ${args[1]}") :)`);    
                } else {
                  return client.say(channel, `@${sender}, el comando "${Config.tvPrefix}${args[1]}" ya existe :(`);
                }
              })
            })
        })
      } else if(args[0] === "edit"){
        if(author.badges.moderator != 1 && author.badges.broadcaster != 1) return; // si no es mod
        if (!args[1]) return client.say(channel, `@${sender}, parámetros incorrectos. Escribe el nombre del comando a editar.`);
        Commands.findOne({
          title: args[1]
        }, (err, command) => {
          if(err) throw err;

          if(!command){
            return client.say(channel, `@${sender}, no encontré el comando "${Config.tvPrefix}${args[1]}"... :(`);
          } else {
            let toEdit = args[2] || "na";
            
            let data;
            if(args[2]) data = args.join(" ").slice(args[0].length + args[1].length + args[2].length + 3);

            switch(toEdit.toLowerCase()){
              case "mensaje":

                if(!args[3]) return client.say(channel, `@${sender}, parámetros incorrectos. Escribe el nuevo mensaje para este comando.`);

                command.message = data;
                command.save();

                return client.say(channel, `@${sender}, actualicé el mensaje del comando "${Config.tvPrefix}${command.title}" -> "${data}". :)`);
              case "nivel":
                if(!args[3]) return client.say(channel, `@${sender}, parámetros incorrectos. Usa: owner/mod/vip/sub/everyone`);

                switch(args[3].toLowerCase()){
                  case "owner":
                  case "jeffrey":
                  case "jeff":
                  case "j":
                    data = "owner";
                    break;

                  case "mod":
                  case "moderador":
                  case "moderator":
                  case "staff":
                    data = "moderator";
                    break;
                    
                  case "vip":
                    data = "vip";
                    break;

                  case "sub":
                  case "prime":
                  case "suscriptor":
                    data = "sub";
                    break;

                  case "todos":
                  case "everyone":
                  case "na":
                    data = "everyone";
                    break;
                }

                command.userLevel = data;
                command.save();

                return client.say(channel, `@${sender}, actualicé el nivel requerido del comando "${Config.tvPrefix}${command.title}" -> "${data}". :)`);

              case "cooldown":
                if(!args[3] || isNaN(args[3])) return client.say(channel, `@${sender}, parámetros incorrectos. Determina el tiempo de cooldown en segundos.`);

                command.cooldown = data;
                command.save()

                return client.say(channel, `@${sender}, actualicé el cooldown del comando "${Config.tvPrefix}${command.title}" -> "${data}s"`);

              default:
                return client.say(channel, `@${sender}, parámetros incorrectos. Usa: mensaje/nivel/cooldown/alias`);
            }

          }
        })
      } else if(args[0] === "del"){

      } else {

        Commands.find({

        }, (err, cmds) => {
          if(err) throw err;

          if(cmds.length === 0){
            return client.say(channel, `@${sender} -> Aún no hay comandos :(`);
          } else {
            let allCommands = "Estos son los comandos disponibles:";

            for(let i = 0; i < cmds.length; i++){
              allCommands = allCommands.concat(`・${Config.tvPrefix}${cmds[i].title}`);
            }

            return client.say(channel, `@${sender} -> ${allCommands}`);
          }
        })
      }
      break;

    default:
      if(!message.startsWith(Config.tvPrefix)) return;

      Commands.findOne({
        title: cmd.slice(Config.tvPrefix.length)
      }, (err, command) => {
        if(err) throw err;

        if(!command){
          return client.say(channel, `@${sender} -> he buscado por todas partes, pero no encuentro "${Config.tvPrefix}${cmd.slice(Config.tvPrefix.length)}"... :(`);
        } else {
          console.log(author);

          if(command.userLevel != "everyone"){
            let reqLevel;
            let actualLevel;
            /*

            4. Owner
            3. Moderator
            2. VIP
            1. Sub
            0. Everyone
            
            */

            // getting reqlevel
            switch(command.userLevel){
              case "owner":
                reqLevel = 4;
                break;

              case "moderator":
                reqLevel = 3;
                break;

              case "vip":
                reqLevel = 2;
                break;

              case "sub":
                reqLevel = 1;
                break;

              default:
                reqLevel = 0;
                break;
            }

            // getting actuallevel
            switch('1'){
              case author.badges.broadcaster:
                actualLevel = 4;
                break;

              case author.badges.moderator:
                actualLevel = 3;
                break;

              case author.badges.vip:
                actualLevel = 2;
                break;

              case author.badges.subscriber:
                actualLevel = 1;
                break;

              default:
                actualLevel = 0;
                break;
            }
            
            if(actualLevel < reqLevel) return;
            
            console.log(cooldowns);
            if(cooldowns.has(author.username)){
              let timer = coolded.get(author.username)
              let left = prettyms((command.cooldown*1000) - (new Date().getTime() - timer), {secondsDecimalDigits: 0 });
              return client.say(channel `@${sender}, usa este comando en ${left}`)
            }

            let timeMS = new Date().getTime();
            tvcooldown.set(author.username, timeMS);
            cooldowns.add(author.username);
            console.log(cooldowns);

            setTimeout(() => {
              tvcooldown.delete(author.username)
              cooldowns.delete(author.username);
            }, command.cooldown * 1000);

            return client.say(channel, `${command.message}`);
          }

          return client.say(channel, `${command.message}`);
        }
      })
      break;
  }
});