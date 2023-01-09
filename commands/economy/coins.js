const ms = require("ms");
const { Command, Categories, HumanMs, Embed, BoostTypes, BoostObjetives } = require("../../src/utils");

const { Config, Responses } = require("../../src/resources/");
const { multiplier } = Config;

const command = new Command({
    name: "coins",
    desc: "Gana dinero extra en un intervalo de 10 minutos (o menos)",
    category: Categories.Economy
});

command.execute = async (interaction, models, params, client) => {
    const { Users } = models
    const { Currency } = client.getCustomEmojis(interaction.guild.id);
    
    await interaction.deferReply();

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    const author = client.users.cache.find(x => x.id === interaction.user.id);
    const member = guild.members.cache.find(x => x.id === interaction.user.id);

    const user = await Users.getOrCreate({
        user_id: author.id,
        guild_id: guild.id
    })

    let cooldownInfo = await user.cooldown("coins", {check: false, info: true})

    let cool = await user.cooldown("coins", {save: false})
    if(cool) return interaction.editReply({content: null, embeds: [
        new Embed({type: "cooldown", data: {cool}})
    ]});


    /* if (member.roles.cache.get(Config.lvl60)) coinsCooldown /= 2;
    if (member.roles.cache.get(Config.lvl99)) coinsCooldown /= 2; */

    let money = Math.ceil(Math.random() * 20);
    let tmoney = `**${Currency}${money.toLocaleString('es-CO')}**`;
    let randommember = guild.members.cache.random();

    while (randommember.user.id === author.id) { // el randommember NO puede ser el mismo usuario
        console.log("'/coins', Es el mismo usuario, buscar otro random")
        randommember = guild.members.cache.random()
    }

    randommember = `**${randommember.displayName}**`;

    let fakemoney = `${Math.ceil(Math.random() * 1000) + 999} ${Currency.name}`;

    if (multiplier != 1) {
        money = money * multiplier;
        tmoney = `**${Currency}${money.toLocaleString('es-CO')}**`;
    }
    
    // buscar si tiene boost
    for (let i = 0; i < user.data.temp_roles.length; i++) {
        const temprole = user.data.temp_roles[i];
        const specialInfo = temprole.special;
        
        if(specialInfo.type === BoostTypes.Multiplier){
            if((specialInfo.objetive === BoostObjetives.Currency || specialInfo.objetive === BoostObjetives.All) && !specialInfo.disabled){
                money = money * Number(specialInfo.value);
                tmoney = `**${Currency}${money.toLocaleString('es-CO')}📈**`;
                console.log(author.tag, "Boost de CURRENCY.")
            }
        }
    }

    let index = Responses.r[Math.floor(Math.random() * Responses.r.length)];
    let textString = index.text;
    let text = textString.replace(
        new RegExp("{ MONEY }", "g"),
        `${tmoney}`
    ).replace(
        new RegExp("{ MEMBER }", "g"),
        `${randommember}`
    ).replace(
        new RegExp("{ FAKE MONEY }", "g"),
        `${fakemoney}`
    ).replace(new RegExp("{ COOLDOWN }", "g"), `${cooldownInfo/60000}`);

    let memberColor = member.displayHexColor;

    let embed = new Embed()
    .defColor(memberColor)
    .defDesc(`${text}.`);

    if(index.author.toUpperCase() != "NONE"){
        let rAuthor = guild.members.cache.find(x => x.id === index.author);
        let suggestor = rAuthor ? rAuthor.user.tag : "un usuario";
        let img = rAuthor ? rAuthor.displayAvatarURL() : guild.iconURL();
        embed.defFooter({text: `• Respuesta sugerida por ${suggestor}`, icon: img})
    }

    await user.addCurrency(money);
    
    return interaction.editReply({embeds: [embed]});
}

module.exports = command;