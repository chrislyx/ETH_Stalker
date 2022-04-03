const { Moralis } = require('/moralis_init');

async function getTransfers(address) {

    // ERC20
    const erc20transfers = new Promise((resolve, reject) => {
        const options = { chain: "0x1", address: address, limit: 500 };
        let erc20 = []
        Moralis.Web3API.account.getTokenTransfers(options).then(res => {
            if (res.result.length > 0) {
                res.result.forEach(el => {
                    erc20.push({
                        tx_hash: el.transaction_hash,
                        contract: el.address,
                        sender: el.from_address,
                        receiver: el.to_address,
                        value: Number(el.value),
                        time: el.block_timestamp,
                        tx_type: el.from_address.toLowerCase() == address.toLowerCase() ? "out" : "in",
                        type: "erc20",
                    })
                });

                const uniqueContracts = [...new Set(erc20.map(el => el.contract))];

                const options2 = { chain: "0x1", addresses: uniqueContracts };
                Moralis.Web3API.token.getTokenMetadata(options2).then(res2 => {
                    if (res2.length > 0) {
                        res2.forEach(el => {
                            erc20.forEach(el2 => {
                                if (el.address == el2.contract) {
                                    el2.name = el.name;
                                    el2.symbol = el.symbol;
                                    el2.value = Number((el2.value / (10 ** Number(el.decimals))).toFixed(6));
                                    el2.logo = el.logo;
                                }
                            })
                        })
                        resolve(erc20)
                    }
                }).catch(err => {
                    console.log(err)
                    reject(err)
                })

            }

        }).catch(err => {
            console.log(err)
            reject(err)
        })
    });

    // ERC721
    const erc721transfers = new Promise((resolve, reject) => {
        const options = { chain: "0x1", address: address, limit: 500 };
        let erc721 = []
        Moralis.Web3API.account.getNFTTransfers(options).then(res => {
            if (res.result.length > 0) {
                res.result.forEach(el => {
                    erc721.push({
                        tx_hash: el.transaction_hash,
                        contract: el.token_address,
                        sender: el.from_address,
                        receiver: el.to_address,
                        token_id: el.token_id,
                        time: el.block_timestamp,
                        tx_type: el.from_address.toLowerCase() == address.toLowerCase() ? "out" : "in",
                        type: "erc721",
                    })
                });

                resolve(erc721)
            }

        }).catch(err => {
            console.log(err)
            reject(err)
        })
    });

    let vals = await Promise.all([erc20transfers, erc721transfers])
        .then((values) => {
            if (values[0].length === 0 && values[1].length === 0) {
                return []
            } else {

                const transfers = [...values[0], ...values[1]]
                transfers.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
                return transfers;

            }

        }).catch(error => {
            console.log(error)
        });
    return vals;
}



module.exports = {
    getTransfers
}