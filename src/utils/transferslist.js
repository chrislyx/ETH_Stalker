async function getTransfersWithList (address_list) {
    var vals = [];
    for(address in address_list){
        vals.push(getTransfers(address));
    }
    vals.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
    return vals;
}

module.exports = {
    getTransfersWithList
}