const { Command, Categories, ErrorEmbed, Embed, DarkShop } = require("../../src/utils")

const Chance = require("chance");
const moment = require("moment");

const command = new Command({
    name: "dschange",
    desc: "Cambia Jeffros a DarkJeffros",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de DarkJeffros que quieres",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    if (moment().day() != 0) {
        return interaction.reply({ ephemeral: true, content: `${client.Emojis.Error} NO puedes cambiar más DarkJeffros hasta que sea domingo.` })
    }
    await interaction.deferReply();
    const { Users } = models;
    const { cantidad } = params
    const { Emojis } = client;

    // codigo
    const quantity = cantidad.value;
    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });

    let jeffros = user.economy.global.jeffros;

    const darkshop = new DarkShop(interaction.guild);
    const one = await darkshop.oneEquals();

    const totalJeffros = Math.round(one * quantity);

    const notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "change",
            error: `No tienes tantos Jeffros para cambiar.
**▸** Inflación: **${Emojis.DarkJeffros}1** = **${Emojis.Jeffros}${one.toLocaleString("es-CO")}**
**▸** Necesitas: **${Emojis.Jeffros}${totalJeffros.toLocaleString("es-CO")}**`,
            money: jeffros
        }
    })

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${Emojis.Jeffros}${totalJeffros.toLocaleString('es-CO')}**`,
                `Se añadieron **${Emojis.DarkJeffros}${quantity.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (totalJeffros > jeffros) return notEnough.send();

    const hoy = new Date();
    const economy = user.economy.dark;

    economy.darkjeffros += quantity;
    user.economy.global.jeffros -= totalJeffros;

    economy.accuracy = economy.accuracy ?? Number((Math.random() * 15).toFixed(1));
    economy.dj_since = economy.dj_since ?? hoy;

    await user.save();

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Una vez a la semana puedes usar \`/predict\` para intentar adivinar si es buena idea vender tus DarkJeffros en el momento`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return interaction.editReply({ embeds });

}

module.exports = command;