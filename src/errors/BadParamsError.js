const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class BadParamsError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {Array<String> | String} instructions Como se tiene que usar eso en su lugar
     */
    constructor(interaction, instructions) {
        super(interaction)
        this.name = "BadParams"

        let help = typeof instructions === "string" ? [instructions] : instructions;
        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction.commandName,
                help
            }
        })
    }
}

module.exports = BadParamsError;