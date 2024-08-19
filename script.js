

let freq = new Map()
await fetch("frequency.txt").then(e => e.text()).then((text) => {
    text.split("").forEach(c => {
        let charObj = {
            character: c,
            pinyin: [],
            freqRank: freq.size,
        }
        freq.set(c, charObj)  
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