const mc = require('minecraft-protocol')
const states = mc.states

const srv = mc.createServer({
    host: "127.0.0.1",
    port: 25565,
    "online-mode": true,
    version: 1.8,
    keepAlive: false,
})

srv.on('login', (client => {
    console.log("Player " + client.username + " has logged in.")

    let local = true
    let proxy = true
    let murdererFound = true

    const entityPlayerMap = new Map()

    const namePlayerMap = new Map()

    const knifes = [267,272,256,280,271,268,32,369,273,277,406,400,285,260,421,19,398,352,391,396,357,279,175,409,364,405,366,283,276,293,359,349,351,333,382,340,2256,2257,2258,2259,2260,2261,2262,2263,2264,2265,2266,2267]

    const proxyclient = mc.createClient({
        host: "play.hypixel.net",
        port: 25565,
        keepAlive: false,
        username: client.username,
        auth: 'microsoft',
        version: 1.8
    })

    client.on('packet', (data, meta) => {
        if (proxyclient.state === states.PLAY && meta.state === states.PLAY) {
            if (proxy) {proxyclient.write(meta.name, data)}
        }
    })

    proxyclient.on('packet', (data, meta) => {
        if (client.state === states.PLAY && meta.state === states.PLAY) {
            if (local) {client.write(meta.name, data)}
        }

        if (meta.name === 'named_entity_spawn') {
            entityPlayerMap.set(data.entityId, data.playerUUID)
        }

        if (meta.name === 'player_info') {
            if (data.action === 0) {
                namePlayerMap.set(data.data[0].UUID, data.data[0].name)
            } 
        }

        if (meta.name === 'entity_equipment') {
            knifes.forEach((id) => {
                if (id === data.item.blockId) {
                    let murdId = entityPlayerMap.get(data.entityId)
                    let murdName = namePlayerMap.get(murdId)

                    if (murdName == undefined || murdererFound) {return}

                    murdererFound = true

                    client.write('chat', {message: `{"extra":[{"bold":"true","color":"dark_green","text":"${murdName} is the murderer!"}],"text": ""}`, position: 0})
                    console.log("Murderer found: " + murdName)

                    entityPlayerMap.clear
                    namePlayerMap.clear
                }
            })
        }

        if (meta.name === 'chat') {
            if (data.message === '{"italic":false,"extra":[{"color":"yellow","text":"The Murderer gets their sword in "},{"color":"red","text":"1 "},{"color":"yellow","text":"second!"}],"text":""}') {
                murdererFound = false
                console.log("A new game has started.")
            } else if (data.message === '{"italic":false,"extra":[{"color":"yellow","text":"You get your sword in "},{"color":"red","text":"1 "},{"color":"yellow","text":"second!"}],"text":""}') {
                murdererFound = true
                console.log("You are the murderer! Have fun ;)")

                entityPlayerMap.clear
                namePlayerMap.clear
            }
        }

    })  

    client.on('end', () => {
        local = false
        if (proxy) {proxyclient.end("Disconnected")}
        proxy = false
        console.log(client.username + " disconnected.")
    })
    client.on('error', () => {
        local = false
        if (proxy) {proxyclient.end("Disconnected")}
        proxy = false
        console.log(client.username + " disconnected.")
    })
    proxyclient.on('end', (reason) => {
        proxy = false
        if (local) {client.end(reason)}
        local = false
    })
    proxyclient.on('error', () => {
        proxy = false
        if (local) {client.end("Error")}
        local = false
    })

}))