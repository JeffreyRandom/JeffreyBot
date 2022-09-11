const moment = require("moment");
const Discord = require("discord.js");
const { time } = Discord;
const ms = require("ms");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds } = models

const { Ticket, ErrorEmbed, intervalGlobalDatas, Categories, ValidateDarkShop } = require("../src/utils");
const { Config, Colores } = require("../src/resources");
const { InteractionType } = require("discord-api-types/v10");
const { jeffreygID, mantenimiento } = Config;

const activeCreatingTicket = new Map();

const ticketCooldown = ms("1m");

module.exports = async (client, interaction) => {
  if(!client.fetchedGuilds.find(x => x === interaction.guild.id)){
    await client.guilds.fetch(interaction.guild.id);
    await interaction.guild.channels.fetch();
    await interaction.guild.roles.fetch();
    await interaction.guild.members.fetch();

    client.fetchedGuilds.push(interaction.guild.id)
    console.log("💚 %s fetched!", interaction.guild.name)
  }

  const author = interaction.user;
  const guild = interaction.guild;
  const customId = interaction.customId;

  const docGuild = await Guilds.findOne({ guild_id: guild.id }) ?? await new Guilds({ guild_id: guild.id }).save();

  const user = await Users.getOrCreate({ user_id: author.id, guild_id: guild.id });

  

  if (interaction.type === InteractionType.ApplicationCommand) { // SLASH COMMANDS
    const commandName = interaction.commandName;
    const slashCommand = client.slash.get(commandName);

    if (mantenimiento && author.id != jeffreygID) return interaction.reply({ content: "Todos las funciones de Jeffrey Bot se encuentran en mantenimiento, lo siento", ephemeral: true });

    let toggledQuery = await ToggledCommands.getToggle(commandName);

    if (toggledQuery /* && author.id != jeffreygID */) {
      let since = time(toggledQuery.since);
      return interaction.reply({ content: null, embeds: [new ErrorEmbed({ type: "toggledCommand", data: { commandName, since, reason: toggledQuery.reason } })], ephemeral: true });
    }

    // params
    const params = {};

    slashCommand.data.options.forEach(o => {
      //console.log(interaction)
      let { name } = o;
      params[name] = interaction.options.get(name)

      // subcommands & groups
      if (!params[name] && o.options) {
        params["subcommand"] = interaction.options.getSubcommand(false); // guarda el subcomando que se está ejecutando
        params["subgroup"] = interaction.options.getSubcommandGroup(false); // guarda el grupo de subcomandos

        params[name] = undefined;

        let toFix = o.options.find(x => x.name === params["subcommand"]);
        if(toFix) subcommandFix(toFix, (x => {
          params[name] = x
        }));
        else {
          if(o.name != params["subcommand"]) return;
          params[name] = {};
          o.options.forEach(op => {
            params[name][op.name] = interaction.options.get(op.name);
          });
        }

        function subcommandFix(sub, callback) {
          let x = {};

          sub.options.forEach(option => {
            let n = option.name;
            x[n] = interaction.options.get(n);

            if (!x[n]) subcgroupFix(option, (y => {
              x = y;
            }))

            callback(x)
          })

          function subcgroupFix(options, callback) {
            if (options.options) {
              subcommandFix(options.options, z => {
                callback(z)
              });
            }
          }
        }
      }

      for(const prop in params){
        if(typeof params[prop] === 'undefined') params[prop] = {}
      }
    })

    await intervalGlobalDatas(client);
    executeSlash(interaction, models, params, client)

    async function executeSlash(interaction, models, params, client) {
      try {
        if(slashCommand.category === Categories.DarkShop){
          // filtro de nivel 5
          let validation = await ValidateDarkShop(user, interaction.user);
          if(!validation.valid) return interaction.reply({embeds: [validation.embed]})
        }
        await slashCommand.execute(interaction, models, params, client);
      } catch (error) {
        console.error(error);
        let help = new ErrorEmbed(interaction, { type: "badCommand", data: { commandName, error } });
        try {
          await interaction.reply({ content: null, embeds: [help], ephemeral: true });
        } catch (er) {
          await help.send();
        }
      }
    }
  } else if (interaction.type === InteractionType.MessageComponent) { // Componentes
    
    const { userId, type } = getTicketInfo(interaction.message);
    let channel, message, ticket, confirmation, actualEmbeds;

    if (customId.toUpperCase().includes("TICKET")) ticket = new Ticket(interaction, client);

    if (ticket) {
      return ticket.handle();
    }
    switch (customId) {
      case "deleteMessage":
        interaction.message.delete();
        break;

      case "acceptSuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = true;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0].setFooter({ text: `Aceptada por ${interaction.user.tag}`, iconURL: Config.bienPng }).setTimestamp();
        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Discord.EmbedBuilder()
          .setAuthor({ name: "¡Se ha aceptado una sugerencia tuya!", iconURL: Config.bienPng })
          .setDescription(`**—** ¡Gracias por ayudarnos a mejorar!
**—** Se ha aceptado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Nos tomamos la libertad de agregarte un role como forma de agradecimiento 😉`)
          .setColor(Colores.verde)
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha aceptado la sugerencia, se ha enviado un mensaje al usuario y se le ha dado el rol de colaborador." });

        break;
      }

      case "denySuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0]
          .setFooter({ text: `Denegada por ${interaction.user.tag}`, iconURL: Config.errorPng })
          .setColor(Colores.rojo)
          .setTimestamp();

        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Discord.EmbedBuilder()
          .setAuthor({ name: "¡Gracias por el interés!", iconURL: Config.errorPng })
          .setDescription(`**—** Hemos denegado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
          .setColor(Colores.rojo)
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole." });
        break;
      }

      case "invalidateSuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0]
          .setFooter({ text: `Invalidada por ${interaction.user.tag}`, iconURL: Config.errorPng })
          .setColor(Colores.rojo)
          .setTimestamp();

        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Discord.EmbedBuilder()
          .setAuthor({ name: "¡Gracias por el interés!", iconURL: Config.errorPng })
          .setDescription(`**—** Hemos determinado que tu sugerencia es inválida:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Puede que esta haya sido una sugerencia repetida, o una ya denegada anteriormente.
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
          .setColor(Colores.rojo)
          .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
          .setTimestamp();

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole." });
        break;
      }

      default:
        console.log("No hay acciones para el botón con customId", customId);
    }
  }

  function getTicketInfo(message) {
    let split = message.channel.name.split("-");

    return {
      type: split[1],
      userId: split[2]
    }
  }

  function resetCooldown(timeout, map) {
    map.set(interaction.user.id, new Date());
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      map.delete(interaction.user.id)
    }, ticketCooldown)
  }
}