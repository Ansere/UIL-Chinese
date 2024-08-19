

let freq = new Map()
let index = 0
await fetch("hanziDB.json").then(e => e.json()).then((data) => {
    data.forEach(entry => {
        let charObj = {
            character: entry["charcter"],
            pinyin: [],
            freqRank: entry["frequency_rank"],
        }
        freq.set(entry["charcter"], charObj)  
    })    
})


let forgotten = ""

await fetch("pinyin.txt").then(e => e.text()).then((text) => {
    text.replace("\r", "").split("\n").forEach(l => {
        let data = l.replace("\r", "").split(" ")
        if (freq.has(data[0])) {
            freq.get(data[0]).pinyin = data.slice(1) 
        }
    })
})

for (let [key, value] of freq.entries()) {
    delete value.character
}

console.log(JSON.stringify(Object.fromEntries(freq)))