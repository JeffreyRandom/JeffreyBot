const { Command, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "warns",
    desc: "Revisa toda la información de tus warns",
    category: "GENERAL"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID del Warn o Softwarn a revisar"
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply({ephemeral: true})
    
    const { id } = params;
    const { Users } = models;
    const member = interaction.member;

    let error = new Embed()
    .defColor(Colores.rojo)
    .defAuthor({text: `${member.user.tag}`, icon: member.user.displayAvatarURL()})
    .defDesc(`Este usuario no tiene warns de ningún tipo.`);
    
    const user = await Users.getOrCreate({user_id: member.id, guild_id: interaction.guild.id})
    
    const warns = user.warns;
    const softwarns = user.softwarns;

    if((!softwarns || softwarns.length === 0) && (!warns || warns.length === 0)){
        return interaction.editReply({embeds: [error], ephemeral: true})
    }

    let warnsE = new Embed()
    .defAuthor({text: `${member.user.tag}'s warns`, icon: member.user.displayAvatarURL()})
    .defDesc(`**Número de warns ** ❛ \`${warns.length}\` ❜`)
    .defColor(Colores.verde);

    let softwarnsE = new Embed()
    .defAuthor({text: `${member.user.tag}'s softwarns`, icon: member.user.displayAvatarURL()})
    .defDesc(`**Número de softwarns ** ❛ \`${softwarns.length}\` ❜`)
    .defColor(Colores.verde);

    if(id) warnsE.defAuthor({text: `Para la ID: ${id}`, title: true});

    // foreach
    warns.forEach(warn => {
        // sacar la regla
        let regla = reglas[warn.rule_id] ? reglas[warn.rule_id].regla : "Víctima de la DARKSHOP";

        if(id && warn.id != id) return;
        warnsE.defField({up: `— ${regla} : Regla N°${warn.rule_id}`, down: `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`})
    });

    softwarns.forEach(softwarn => {
        // sacar la regla
        let regla = reglas[softwarn.rule_id].regla;

        if(id && softwarn.id != id) return;
        softwarnsE.defField({up: `— ${regla} : Regla N°${softwarn.rule_id}`, down: `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`})
    });

    return interaction.editReply({embeds: [warnsE, softwarnsE], ephemeral: true});
}

command.execSelf = async (interaction, models) => {
    await interaction.editReply({content: "auughh"});

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    const author = guild.members.cache.find(x => x.id === interaction.user.id);

    // codigo
    let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

    if(client.user.id === Config.testingJBID){
        staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    }

    /* const isStaff = author.roles.cache.find(x => x.id === staffRole.id) ? true : false;
    // crear boton de eliminar mensaje
    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId("deleteMessage")
                .setLabel("Eliminar mensaje")
                .setStyle("DANGER")
        ) */

    const member = interaction.options.getUser("usuario") && isStaff ? guild.members.cache.find(x => x.id === interaction.options.getUser("usuario").id) : author;
    const id = interaction.options.getInteger("id");

    if(!member) return interaction.reply({content: "No pude encontrar a ese usuario", ephemeral: true});

    let error = new Discord.MessageEmbed()
    .setColor(Colores.rojo)
    .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL())
    .setDescription(`Este usuario no tiene warns de ningún tipo.`);
    
    const user = await Users.findOne({
        user_id: member.id,
        guild_id: guild.id
    });

    if(!user) return interaction.reply({embeds: [error], ephemeral: true});
    
    const warns = user.warns;
    const softwarns = user.softwarns;

    if((!softwarns || softwarns.length === 0) && (!warns || warns.length === 0)){
        return interaction.reply({embeds: [error], ephemeral: true})
    }

    let warnsE = new Discord.MessageEmbed()
    .setAuthor(`${member.user.tag}'s warns`, member.user.displayAvatarURL())
    .setDescription(`**Número de warns ** ❛ \`${warns.length}\` ❜`)
    .setColor(Colores.verde);

    let softwarnsE = new Discord.MessageEmbed()
    .setAuthor(`${member.user.tag}'s softwarns`, member.user.displayAvatarURL())
    .setDescription(`**Número de softwarns ** ❛ \`${softwarns.length}\` ❜`)
    .setColor(Colores.verde);

    if(id) warnsE.setTitle(`Para la ID: ${id}`);

    // foreach
    warns.forEach(warn => {
        // sacar la regla
        let regla = reglas[warn.rule_id] ? reglas[warn.rule_id].regla : "Víctima de la DARKSHOP";

        if(id && warn.id != id) return;
        warnsE.addField(`— ${regla} : Regla N°${warn.rule_id}`, `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`)
    });

    softwarns.forEach(softwarn => {
        // sacar la regla
        let regla = reglas[softwarn.rule_id].regla;

        if(id && softwarn.id != id) return;
        softwarnsE.addField(`— ${regla} : Regla N°${softwarn.rule_id}`, `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`)
    });

    if(isStaff){
        interaction.reply({embeds: [warnsE, softwarnsE], ephemeral: false, components: [row]});
        /* const reply = await interaction.fetchReply()

        const f = i => i.customId === 'deleteMessage' && i.user.id === author.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter: f, time: 15000, max: 1 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            await i.deleteReply();
        });

        collector.on("end", async i => {
            await reply.edit({ components: []})
        }) */
    } else {
        return interaction.reply({embeds: [warnsE, softwarnsE], ephemeral: true});
    }
}

command.execAdmin = async (interaction, models, usuario) => {
    await interaction.editReply({content: "auughh pero admin"});
}

module.exports = command;