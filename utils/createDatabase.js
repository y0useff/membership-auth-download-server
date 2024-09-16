const {createClient} = require('redis')
// let client;
(async ()=> {
    const client = await createClient({url: `redis://127.0.0.1:6379`})
        .on('error', err => console.log('Redis Client Error', err))
        .connect();


        await client.FLUSHALL();
        await client.hSet("media", "id", 1)
        await client.hSet("member", "id", 1)

        await client.ft.create("")
    }
    
)();

