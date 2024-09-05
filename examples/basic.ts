import Ethereum from "@irys/upload-ethereum"
import NodeIrys from "@irys/upload"
(async function(){

    const client = await new NodeIrys(Ethereum).withWallet("...").build()
    console.log(client)
    const res = await client.upload("test", {tags: [{name: "hello", value: "world"}]});
    console.log(res)

})()
