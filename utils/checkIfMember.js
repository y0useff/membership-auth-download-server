const {STRIPE_KEY_SECRET} = require("../config.json")
const stripe = require('stripe')(STRIPE_KEY_SECRET)
const {createClient} = require('redis')

let client;
(async ()=> {
    client = await createClient({url: `redis://127.0.0.1:6379`})
        .on('error', err => console.log('Redis Client Error', err))
        .connect();
        // checkMembership()
    }
    
)();
async function getCustomerIdByEmail(email) { 
    const customer = await stripe.customers.search({
        query: `email:'${email}'`,
    })
    
    if (customer.data.length == 0 || customer.data == undefined) return undefined
    
    if (customer.data.length > 1) return "Found More Than One Customer With This Email. Contact Support."

    return customer.data
}

async function getSubscription(customer_id) {
    const subscription = await stripe.subscriptions.list({
        customer: customer_id
    })
    if (subscription.data.length == 0) return {}
    return subscription.data[subscription.data.length-1]
}

async function checkMembership(email="test123@gmail.com") {

    const customer_list = await getCustomerIdByEmail(email)
    if (customer_list == undefined) return false

    const customer = (customer_list)[0]
    if (customer == undefined) return false

    const customer_id = customer.id
    if (customer_id == undefined) return false

    const isActive = (await getSubscription(customer_id)).plan.active
    if (isActive) return isActive 
    //  {
    //     let current_downloads = 0
    //     const user = await client.ft.search("idx:member", `@email:${email}`)
    //     console.log(user)
    // }
}

module.exports = {checkMembership};
