const { Command, Categories, Confirmation, Embed, Sleep, GetRandomItem } = require("../../src/utils")
const { Colores } = require("../../src/resources");
const { EconomyError } = require("../../src/errors");

const command = new Command({
    name: "pay",
    desc: "Le pagas dinero a otro usuario"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que le vas a dar dinero",
    req: true
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero que vas a dar",
    min: 1
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { Users } = models
    const { usuario, cantidad } = params;
    const { EmojisObject } = client;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const author = interaction.user;
    const recieverMember = usuario.member;
    const quantity = cantidad?.value;

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

    // codigo
    let author_user = params.getUser();

    const reciever = await Users.getWork({
        user_id: recieverMember.id,
        guild_id: guild.id
    });

    const debt = author_user.data.debts.findIndex(x => x.user === recieverMember.id);

    if (!quantity) {
        if (author.id === recieverMember.id) {
            return interaction.editReply({
                embeds: [
                    new Embed()
                        .defColor(Colores.verdejeffrey)
                        .defDesc("Por suerte, no te debes nada.")
                ]
            })
        } else
            if (debt != -1) {
                return interaction.editReply({
                    embeds: [
                        new Embed()
                            .defTitle("Deuda pendiente")
                            .defDesc(`**—** Aún le debes **${Currency}${author_user.data.debts[debt].debt.toLocaleString("es-CO")}** a ${recieverMember}.`)
                            .defColor(Colores.rojooscuro)
                            .defFooter({ text: "Desde", icon: interaction.guild.iconURL({ dynamic: true }), timestamp: author_user.data.debts[debt].since })
                    ]
                })
            }
        return interaction.editReply({
            embeds: [
                new Embed()
                    .defTitle("Estás limpi@")
                    .defFooter({ text: "No le debes nada a este usuario", icon: recieverMember.displayAvatarURL({ dynamic: true }) })
                    .defColor(Colores.verde)
            ]
        });
    }

    let toConfirm = [
        `¿Deseas pagarle **${Currency}${quantity.toLocaleString('es-CO')}** a ${recieverMember}?`,
        `Tienes **${Currency}${author_user.economy.global.currency.toLocaleString('es-CO')}**.`,
        `${recieverMember} tiene **${Currency}${reciever.economy.global.currency.toLocaleString('es-CO')}**.`,
        `Se mencionará al destinatario.`,
        `Esto no se puede deshacer, a menos que te los den devuelta.`
    ];

    let confirmation = await Confirmation("Pagar dinero", toConfirm, interaction);
    if (!confirmation) return;

    if (!author_user.canBuy(quantity)) throw new EconomyError(interaction, "No tienes tanto dinero", author_user.economy.global.currency);

    if (author.id === recieverMember.id) {
        let msg = await interaction.fetchReply();
        await Sleep(2000)

        let e = new Embed(msg.embeds[0])
            .defAuthor({ text: "Oye esto no está bien", icon: EmojisObject.Loading.url })

        await interaction.editReply({ embeds: [e] })

        await Sleep(2000)
        e.defAuthor({ text: "Por favor, aléjate", icon: EmojisObject.Error.url })
            .defColor(Colores.rojo)
            .defDesc("No puedes pagarte dinero a ti mismo.")
        return interaction.editReply({ embeds: [e] });
    }

    if (debt != -1) {
        author_user.data.debts[debt].debt -= quantity
        if (author_user.data.debts[debt].debt <= 0) author_user.data.debts.splice(debt, 1);
    }

    author_user.economy.global.currency -= quantity;
    await reciever.addCurrency(quantity);
    await author_user.save();

    const messenger = `**${author}**`;
    const pay = `**${Currency}${quantity.toLocaleString('es-CO')}**`;

    let possibleDescriptions = [
        `${messenger} le pagó ${pay} a ${recieverMember}`,
        `${recieverMember} recibió los ${pay} de ${messenger}`,
        `${messenger} le dio ${pay} a ${recieverMember}`,
        `${messenger} hizo una transacción de ${pay} para ${recieverMember}`,
        `${recieverMember} depositó los ${pay} de ${messenger}`,
        `${messenger} entregó ${pay} a ${recieverMember}`
    ];

    let description = GetRandomItem(possibleDescriptions);

    let doneEmbed = new Embed({
        type: "success",
        data: {
            desc: description
        }
    })
    interaction.editReply({ embeds: [new Embed({ type: "success" })] });

    return interaction.followUp({ content: `**${author.tag}** ➡️ **${recieverMember}**.`, embeds: [doneEmbed], allowedMentions: { parse: ["users"] } });
}

module.exports = command;