const { Collection, Routes, REST } = require("discord.js");

const { GlobalDatas } = require("mongoose").models;

const fs = require("fs")

class Commands {
    constructor(paths = ["./commands/"]){
        this.paths = paths;
        this.routes = [];
        this.commands = [];
        this.ids = [];

        this.route = process.env.DEV == "TRUE"
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.slashGuildId)
            : Routes.applicationCommands(process.env.CLIENT_ID)

        this.rest = new REST({ version: '10'}).setToken(process.env.TOKEN);
    }

    async prepare(client, Ids = []){
        client.slash = new Collection();
        
        this.client = client;
        this.ids = Ids;

        for await (const path of this.paths) {
            this.path = path;
            await this.#load()
        }
        
        return new Promise(async (res, rej) => {
            let response = await this.#register()

            if(response instanceof Error) rej(response)
            else res(response)
        })
    }

    async #load() {
        console.log("============ CARGANDO COMANDOS ============");
        console.log(this.path);
        const commandsFolder = fs.readdirSync(this.path).filter(file => !file.endsWith(".txt"));

        this.ids.forEach(guildId => {
            this.routes.push(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId));
        })
      
        for (const folder of commandsFolder) {
          const commandFiles = fs.readdirSync(`${this.path}/${folder}`).filter(file => file.endsWith(".js"));
      
          for(const file of commandFiles) {
            const command = require(`${this.path}/${folder}/${file}`);

            this.client.slash.set(command.data.name, command);
            console.log("▶️ Comando", command.data.name, "recibido, agregado a la lista")
            this.commands.push(command.data.toJSON())
          }
        }
    }

    async #register() {
        console.log("============ REGISTRANDO COMANDOS ============");
        try {
            console.log("⚪ Actualizando comandos para la ruta:", this.route)
            console.log("MODO DE INICIACIÓN EN DEVELOPER:", process.env.DEV);

            if(process.env.DEV == "TRUE"){
                console.log("🔄 Creando Dev Guild 🔄")
                await GlobalDatas.newGuildCommands({route: this.route, dev: true})

                // eliminar cualquier comando global
                if(this.rest.get(Routes.applicationCommands(process.env.CLIENT_ID)))
                    this.rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: []})

                this.removeGuildCommands(true)
            } else {
                this.removeGuildCommands(false)
            }

            console.log("⚪ ACTUALIZANDO COMANDOS")
            await this.rest.put(this.route, {body: this.commands})
            console.log("🟢 SLASH COMMANDS ACTUALIZADOS")
            return this
        } catch (error) {
            return new Error(error)
        }
        return;
    }

    async removeGuildCommands(dev){
        console.log("⚪ BUSCANDO POSIBLES GUILDCOMMANDS")
        let guild_commands = await GlobalDatas.getGuildCommands();

        guild_commands.forEach(async q => {
            let data = q.info;

            if(!dev){
                console.log("🔄 Eliminando Dev Guilds 🔄")

                if(!this.routes.find(x => x === data.route)){
                    await GlobalDatas.removeGuildCommand(data.route);
                    await this.rest.put(data.route, { body: [] })
                }
            }

            if((this.rest.get(data.route) && data.dev != dev)){
                console.log("🔄 Eliminando Guilds 🔄")
                await this.rest.put(data.route, { body: [] })

                // eliminar globaldata
                await GlobalDatas.removeGuildCommand(data.route);
            }
        })

        console.log("🟢 POSIBLES GUILDCOMMANDS HANDLED")
        return;
    }

    /* async #addPerms(guild, client) {
        const { Guilds } = models
        let actualPermissions;
        const commandList = process.env.DEV == "TRUE" ? guild.commands.cache : client.application.commands.cache
        
        commandList.forEach(async comm => {
            //console.log(comm)
            let permissions = [];
            const doc = await Guilds.getById(guild.id);

            const cmd = client.slash.get(comm.name)
            actualPermissions = cmd.permissions;

            if(!(actualPermissions instanceof Array) && actualPermissions !== null) return console.error("BAD PERMISSIONS, NOT ARRAY!", cmd)

            let query = [];
            if(!actualPermissions) return;
            actualPermissions.forEach(p => {
                switch(p){
                    case "OWNER":
                        permissions.push({
                            id: guild.ownerId,
                            type: "USER",
                            permission: true
                        });
                        break;
                    case "ADMIN":
                        doc.roles.admins.forEach(a => query.push(a));
                        break;
                    case "STAFF":
                        doc.roles.staffs.forEach(a => query.push(a));
                        break;
                }
            })

            await guild.roles.fetch();

            if(query.length == 0){ // buscar roles con "Admin", si no hay, owner.
                let adminroles = guild.roles.cache.filter(x => x.permissions.has("ADMINISTRATOR") && !x.tags).toJSON();

                if(adminroles.length === 0) permissions.push({ // no hay roles con Admin
                    id: guild.ownerId,
                    type: "USER",
                    permission: true
                });

                adminroles.forEach(perm => {
                    permissions.push({
                        id: perm.id,
                        type: "ROLE",
                        permission: true
                    })
                })
            } else {
                query.forEach(perm => {
                    permissions.push({
                        id: perm,
                        type: "ROLE",
                        permission: true
                    })
                })
            }

            console.log("fiumba", comm)
            await comm.setDefaultMemberPermissions({ permissions });
        })
    } */
}

module.exports = Commands;