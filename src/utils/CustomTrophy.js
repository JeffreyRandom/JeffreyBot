const ms = require("ms");
const { Error } = require("mongoose");
const { CustomElements, Users } = require("mongoose").models;
const { CommandInteraction, ModalSubmitInteraction, GuildMember, Guild, bold } = require("discord.js");

const Embed = require("./Embed");
const { BadParamsError, DoesntExistsError } = require("../errors");
const { Enum, BoostTypes, BoostObjetives, ShopTypes, DirectMessageType, TrophyRequirements } = require("./Enums");
const { LimitedTime, FindNewId, PrettyCurrency, SendDirect } = require("./functions");
const { Colores } = require("../resources");
const HumanMs = require("./HumanMs");

class CustomTrophy {
    /**
     * @param {CommandInteraction | ModalSubmitInteraction | Guild } interaction 
     * @param {*} params 
     */
    constructor(interaction) {
        this.interaction = interaction;
    }

    async save(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        this.doc.addTrophy(this, id)
        await this.doc.save()

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Trofeo. Usa ${this.interaction.client.mentionCommand("elements trophies toggle")} para que se de automáticamente al cumplir los requisitos`,
                            `Usa ${this.interaction.client.mentionCommand("elements trophies edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    async replace(id, params) {
        const actualTrophy = await this.#fetch(id);

        let trophyObj = new CustomTrophy(this.interaction).create(actualTrophy);
        let trophy = new CustomTrophy(this.interaction).create({
            name: params.name?.value ?? trophyObj.name,
            desc: params.desc?.value ?? trophyObj.desc,
            req: params.req?.value ?? trophyObj.req.role,
            dado: params.dado?.value ?? trophyObj.given.role
        });

        let index = this.doc.trophies.findIndex(x => x.id === id);
        this.doc.trophies[index] = { ...trophy, id };
        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Trofeo`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    async delete(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        try {
            const users = await Users.find({ guild_id: this.interaction.guild.id });
            let count = 0;
            for await (const user of users) {
                let index = user.data.trophies.findIndex(x => x.element_id === id);
                if (index === -1) continue;
                count++
                user.data.trophies.splice(index, 1);

                await user.save();
            }

            this.doc.deleteTrophy(id);
            await this.doc.save();

            return await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: ["Se ha eliminado el Trofeo", `Se eliminó el Trofeo de ${count} usuarios`]
                        }
                    })
                ]
            })
        } catch (err) {
            console.error("🔴 %s", err);
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");
        }
    }

    async toggle(id) {
        const trophy = await this.#fetch(id);

        if (trophy.enabled) trophy.enabled = false
        else trophy.enabled = true;

        await this.doc.save();

        let embeds = [
            new Embed({
                type: "success",
                data: {
                    desc: `Se ha ${trophy.enabled ? "activado" : "desactivado"} el Trofeo`
                }
            })
        ]

        let sug = new Embed({
            type: "didYouKnow",
            data: {
                text: `Un Trofeo siempre debe tener al menos un requerimiento, sino, **NUNCA** nadie lo tendrá`,
                likelihood: 50
            }
        })

        if (sug.likelihood) embeds.push(sug);

        return await this.interaction.editReply({ embeds })
    }

    /**
     * 
     * @param {Number} id Trophy ID
     * @param {GuildMember} member 
     * @param {any} userDoc Mongoose User Document
     * @param {Number} newId Nueva ID al agregarse el trofeo al usuario
     * @param {Boolean} save 
     * @returns {Promise<any>} Mongoose User
     */
    async manage(id, member, userDoc, newId, save = true) {
        this.doc = await CustomElements.getWork(this.interaction instanceof Guild ? this.interaction.id : this.interaction.guild.id);
        this.member = member;
        this.user = userDoc;

        const trophy = this.doc.getTrophy(id);

        let grant = true;
        const reqList = trophy.req;

        if (this.user.getTrophies().find(x => x.element_id === trophy.id)) grant = false;
        if (!trophy.enabled) grant = false;

        let entered = false;

        requirements:
        for (const prop of Object.keys(reqList)) {
            if (!grant) break requirements;
            const value = reqList[prop];
            if (!value) continue requirements;

            switch (prop) {
                case "role":
                    entered = true;
                    if (!member.roles.cache.get(value)) grant = false;
                    break;
                case "totals":
                    totalLoop:
                    for (const totalprop of Object.keys(value)) {
                        if (!grant) break totalLoop;

                        const totalValue = value[totalprop];
                        if (!totalValue) continue totalLoop;
                        entered = true;
                        let moduleCount = "";

                        switch (totalprop) {
                            case "currency":
                                moduleCount = "normal_currency"
                                break;
                            case "darkcurrency":
                                moduleCount = "dark_currency"
                                break;
                            case "warns":
                            case "blackjack":
                            case "roulette":
                            case "subscriptions_currency":
                                moduleCount = totalprop;
                                break;
                        }

                        if (this.user.getCount(moduleCount) < totalValue) grant = false;
                    }
                    break;
                case "moment":
                    momentLoop:
                    for (const momentprop of Object.keys(value)) {
                        if (!grant) break momentLoop;

                        const momentValue = value[momentprop];
                        if (!momentValue) continue momentLoop;
                        entered = true;

                        switch (momentprop) {
                            case "currency":
                                if (momentValue < 0) {
                                    if (this.user.getCurrency() > momentValue) grant = false;
                                } else {
                                    if (this.user.getCurrency() < momentValue) grant = false;
                                }
                                break;
                            case "darkcurrency":
                                if (this.user.getDarkCurrency() < momentValue) grant = false;
                                break;
                        }
                    }
                    break;

            }
        }

        if (grant && entered) {
            // añadirlo a la lista de trophies
            this.user.data.trophies.push({
                element_id: trophy.id,
                id: newId
            })

            this.user.markModified("data.trophies")

            await this.#rewardsWork(trophy);

            if (save) await this.user.save();

            try {
                await this.#sendDM(member, trophy);
            } catch (err) {
                console.error("🔴 %s", err);
            }
        }

        return this.user;
    }

    /**
     * Agrega o elimina un Trofeo con ID
     * @param {Number} id 
     * @param {GuildMember} member 
     * @returns {Promise<Boolean>} Si se dio el Trofeo
     */
    async manual(id, member) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);
        const trophy = this.doc.getTrophy(id);
        if (!trophy)
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");

        this.member = member;
        this.user = await Users.getWork({ user_id: member.id, guild_id: member.guild.id });

        const f = x => x.element_id === trophy.id;

        let granted;

        // Ya tiene el Trofeo
        if (this.user.getTrophies().find(f)) {
            let index = this.user.data.trophies.findIndex(f);

            this.user.data.trophies.splice(index, 1)
            granted = false;
        } else {
            // No lo tiene
            granted = true;
            this.user.data.trophies.push({
                element_id: trophy.id,
                id
            })

            await this.#reqWork(trophy)
            await this.#rewardsWork(trophy)

            try {
                await this.#sendDM(member, trophy);
            } catch (err) {
                console.error("🔴 %s", err);
            }
        }

        await this.user.save();
        return granted;
    }

    async changeTotalReq(id, data) {
        return await this.#changeReq(id, data, "totals");
    }

    async changeMomentReq(id, data) {
        return await this.#changeReq(id, data, "moment");
    }

    async changeMoneyGiven(id, data) {
        const trophy = await this.#fetch(id);

        for (const prop of Object.keys(data)) {
            const value = data[prop];
            if (!value) continue;

            trophy.given[prop] = value;
        }

        try {
            await this.doc.save();
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                throw new BadParamsError(this.interaction, [
                    "Revisa los campos",
                    err.message
                ])
            }
            throw err;
        }

        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async changeBoostGiven(id, data) {
        const trophy = await this.#fetch(id);

        for (const prop of Object.keys(data)) {
            if (data[prop].length === 0) continue;
            let value;
            const notValid = new BadParamsError(this.interaction, `\`${data[prop]}\` **NO** es un valor válido`);

            if (Number(ms(data[prop]) && ms(data[prop]) > ms("1s"))) {
                value = data[prop]
            } else {
                value = Number(data[prop]);

                if (isNaN(value) || value === Infinity) throw notValid;
            }

            if (!value) continue;

            // validation
            switch (prop) {
                case "type":
                    if (!new Enum(BoostTypes).exists(value)) throw notValid;
                    break;

                case "objetive":
                    if (!new Enum(BoostObjetives).exists(value)) throw notValid;
                    break;

                case "duration": {
                    let duration = ms(value);
                    if (duration < ms("1s") || isNaN(duration)) throw notValid;
                }
            }

            trophy.given.boost[prop] = value;
        }

        try {
            await this.doc.save();
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                throw new BadParamsError(this.interaction, [
                    "Revisa los campos",
                    err.message
                ])
            }
            throw err;
        }

        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async changeItemGiven(id, data) {
        const trophy = await this.#fetch(id);

        for (const prop of Object.keys(data)) {
            if (data[prop].length === 0) continue;
            let value;
            const notValid = new BadParamsError(this.interaction, `\`${data[prop]}\` **NO** es un valor válido`);

            value = Number(data[prop]);

            if (isNaN(value) || value === Infinity) throw notValid;
            if (!value) continue;

            // validation
            if (prop === "shopType") {
                if (value > 3 || value < 1) throw notValid;

                value = parseInt(value)
            }

            trophy.given.item[prop] = value;
        }

        try {
            await this.doc.save();
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                throw new BadParamsError(this.interaction, [
                    "Revisa los campos",
                    err.message
                ])
            }
            throw err;
        }

        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async #fetch(trophyId) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);
        const trophy = this.doc.getTrophy(trophyId);
        if (!trophy)
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${trophyId}\``, "este servidor");

        return trophy
    }

    async #changeReq(id, data, list) {
        const trophy = await this.#fetch(id);

        for (const prop of Object.keys(data)) {
            const value = data[prop];

            if (!value) continue;
            trophy.req[list][prop] = value;
        }
        try {
            await this.doc.save()
        } catch (err) {
            if (err instanceof Error.ValidationError) {
                throw new BadParamsError(this.interaction, [
                    "Revisa los campos",
                    err.message
                ])
            }
            throw err;
        }

        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async #reqWork(trophy) {
        const reqList = trophy.req;
        const guild = this.interaction instanceof Guild ? this.interaction : this.interaction.guild;

        this.reqsDone = [];

        req:
        for (const prop of Object.keys(reqList)) {
            const value = reqList[prop];
            if (!value) continue req;

            switch (prop) {
                case "role":
                    this.reqsDone.push(`**El rol @${guild.roles.cache.get(value).name}**`);
                    break;
                case "totals":
                    Object.keys(value).forEach(totalProps => {
                        if (value[totalProps]) {
                            const TrophyEnums = new Enum(TrophyRequirements);
                            let reqDone, reqExpl;
                            switch (totalProps) {
                                case TrophyRequirements.SubscriptionsCurrency:
                                case TrophyRequirements.Currency:
                                    reqDone = PrettyCurrency(guild, value[totalProps]);
                                    break;
                                case TrophyRequirements.DarkCurrency:
                                    reqDone = PrettyCurrency(guild, value[totalProps], { name: "DarkCurrency" });
                                    break;
                                default:
                                    reqDone = bold(value[totalProps].toLocaleString("es-CO"));
                            }

                            switch (totalProps) {
                                case TrophyRequirements.Warns:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} **totales**`;
                                    break;
                                case TrophyRequirements.DarkCurrency:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} **totales** invertidos`;
                                    break;
                                case TrophyRequirements.Currency:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} **totales** ganados`;
                                    break;
                                case TrophyRequirements.Blackjack:
                                    reqExpl = `${TrophyEnums.translate(totalProps)}(s) ganados`;
                                    break;
                                case TrophyRequirements.Roulette:
                                    reqExpl = `Jugada(s) en la ${TrophyEnums.translate(totalProps)}`;
                                    break;
                                case TrophyRequirements.SubscriptionsCurrency:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} gastado`;
                                    break;
                                default:
                                    reqExpl = TrophyEnums.translate(totalProps);
                            }

                            this.reqsDone.push(`${reqExpl} **≥** ${reqDone}`)
                        }
                    });
                    break;
                case "moment":
                    Object.keys(value).forEach(totalProps => {
                        if (value[totalProps]) {
                            const TrophyEnums = new Enum(TrophyRequirements);
                            let reqDone, reqExpl;
                            switch (totalProps) {
                                case TrophyRequirements.SubscriptionsCurrency:
                                case TrophyRequirements.Currency:
                                    reqDone = PrettyCurrency(guild, value[totalProps]);
                                    break;
                                case TrophyRequirements.DarkCurrency:
                                    reqDone = PrettyCurrency(guild, value[totalProps], { name: "DarkCurrency" });
                                    break;
                                default:
                                    reqDone = bold(value[totalProps].toLocaleString("es-CO"));
                            }

                            switch (totalProps) {
                                case TrophyRequirements.DarkCurrency:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} actualmente en inversión`;
                                    break;
                                case TrophyRequirements.Currency:
                                    reqExpl = `${TrophyEnums.translate(totalProps)} en tu cuenta`;
                                    break;
                                default:
                                    reqExpl = TrophyEnums.translate(totalProps);
                            }

                            this.reqsDone.push(`${reqExpl} **≥** ${reqDone}`)
                        }
                    });
                    break;
            }
        }
    }

    async #rewardsWork(trophy) {
        const givenList = trophy.given;
        const guild = this.interaction instanceof Guild ? this.interaction : this.interaction.guild;

        this.rewardsGiven = [];

        given:
        for (const prop of Object.keys(givenList)) {
            const value = givenList[prop];
            if (!value) continue given;

            switch (prop) {
                case "currency":
                    await this.user.addCurrency(value);

                    this.rewardsGiven.push(`${PrettyCurrency(guild, value)}`);
                    break;
                case "darkcurrency":
                    await this.user.addDarkCurrency(value);

                    this.rewardsGiven.push(`${PrettyCurrency(guild, value, { name: "DarkCurrency" })}`);
                    break;
                case "role":
                    await this.member.roles.add(value)
                        .catch(err => console.error("🔴 %s", err));;

                    this.rewardsGiven.push(`**El rol @${this.member.roles.cache.get(value).name}**`);

                    break;
                case "boost":
                    const { type: boost_type, objetive: boost_objetive, value: boost_value, duration } = value;
                    if (!boost_value || !boost_type || !boost_objetive || !duration) continue given;
                    await LimitedTime(this.member, null, ms(duration), {}, boost_type, boost_objetive, boost_value);

                    let boostobj = new Enum(BoostObjetives).translate(boost_objetive);
                    let boosttype = new Enum(BoostTypes).translate(boost_type);

                    this.rewardsGiven.push(`**Un Boost ${boosttype} de ${boostobj} x${boost_value}** por **${new HumanMs(ms(duration)).human}**`);
                    break;
                case "item":
                    const { id: item_id, shopType } = value;
                    if (!item_id) continue given;
                    const newUseId = FindNewId(await Users.find(), "data.inventory", "use_id");
                    this.user.data.inventory.push({ shopType, item_id, use_id: newUseId })

                    this.rewardsGiven.push(`**Un Item de la ${new Enum(ShopTypes).translate(Number(shopType))}**`);
                    break;
            }
        }
    }

    /**
     * @param {GuildMember} member 
     * @param {*} trophy 
     */
    async #sendDM(member, trophy) {
        const embeds = [
            new Embed()
                .defTitle(`Desbloqueaste un Trofeo en ${member.guild.name}`)
                .defColor(Colores.verdejeffrey)
                .defDesc(`**"${trophy.name}"**\n**—** ${trophy.desc}`)
                .defFooter({ text: "Se mostrará en tu perfil al usar /stats", icon: member.guild.iconURL({ dynamic: true }) }),
        ]

        // requerimentos
        let reqs = new Embed()
            .defTitle(`Lo conseguiste por...`)
            .defColor(Colores.nocolor);

        reqs.data.description = "";


        let automatic = false;

        this.reqsDone.forEach(req => {
            automatic = true;
            reqs.data.description += `▸ ${req}.\n`
        })


        // recompensas
        let rew = new Embed()
            .defTitle(`Recibiste...`)
            .defColor(Colores.verde);

        rew.data.description = "";

        let rewarded = false;

        this.rewardsGiven.forEach(reward => {
            rewarded = true;
            rew.data.description += `▸ ${reward}.\n`
        })

        if (rewarded) embeds.push(rew);
        if (automatic) embeds.push(reqs);

        await SendDirect(this.interaction, member, DirectMessageType.Trophies, { embeds });
    }

    /**
     * @param {{name, desc, req, dado}} params 
     */
    create(params) {
        const { name, desc, req, dado } = params;

        if (!name)
            throw new BadParamsError(this.interaction, "El Trofeo debe tener al menos un nombre");

        this.name = name?.value ?? name;
        this.desc = desc?.value ?? desc;
        this.req = {
            role: req?.value ?? req?.role ?? null
        }
        this.given = {
            role: dado?.value ?? dado
        }

        return this
    }
}

module.exports = CustomTrophy;