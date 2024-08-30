import Ethereum from "@irys-network/bundler-ethereum-node"
import NodeIrys from "@irys-network/bundler-client-node"
(async function(){

    const client = await new NodeIrys(Ethereum).withWallet("...").build()
    console.log(client)
    const res = await client.upload("test", {tags: [{name: "hello", value: "world"}]});
    console.log(res)

})()
