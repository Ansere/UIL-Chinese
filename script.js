let allWords = []
let total = 0;
let correct = 0;
let streak = 0;

console.log(window.localStorage.getItem("settings"))

let settings = {
    customWordList: null,
    removeAfter: false,
    removeAfterVal: 1,
    between: false,
    lower: "",
    upper: "",
    maxFrequency: true,
    maxFrequencyVal: 5000,
    wordData: null
}

document.addEventListener("DOMContentLoaded", () => {
    //init settings
    [].slice.call(document.getElementById("wordListSettingsDiv").getElementsByTagName("input")).forEach(element => {
        if (element.id == "customWordList") {
            return;
        } else if (element.id == "lowerBound" || element.id == "upperBound") {
            element.addEventListener("input", () => {
                element.value = element.value.toLowerCase().split("").filter(e => "qwertyuiopasdfghjklzxcbnmv12345".includes(e)).join("")
                updateWordList()
            })
            return;
        } else if (element.id == "maxFrequencyVal") {
            element.addEventListener("input", () => {
                updateSettings()
                updateWordList()
            })
            return;
        }
        element.onclick = () => {
            if (element.id == "between" && element.checked) {
                if (document.getElementById("lowerBound").value == "") {
                    document.getElementById("lowerBound").value = "a1"
                }
                if (document.getElementById("upperBound").value == "") {
                    document.getElementById("upperBound").value = "zuo4"
                }
            }
            updateWordList()
        }
    });
    [].slice.call(document.getElementById("wordSourceSettings").getElementsByTagName("input")).forEach(e => {
        e.onclick = () => {
            if (e.id == "customWordList") {
                return;
            }
            settings.customWordList = null;
            document.getElementById("custom").checked = false
            document.getElementById("custom").dispatchEvent(new Event("change"))
            updateWordList()
        }
    })
    document.getElementById("customWordList").addEventListener("keyup", (e) => {
        if (e.key !== "Enter") {
            return;
        }
        e.preventDefault()
        let wordList = document.getElementById("customWordList").value
        if (wordList.length == 0) {
            return
        }
        document.getElementById("customWordList").value = ""
        let set = new Set(wordList.split("\n"))
        let customWordList = allWords.filter(w =>  {
            if (set.has(w)) {
                set.delete(w);
                return true;
            } else {
                return false;
            }
        })
        if (customWordList.length == 0) {
            alert("Custom word list failed! Make sure they are new line separated and include valid words.")
            return;
        }
        if (set.size > 0) {
            alert("Could not find words: " + Array.from(set).join(", "))
        }
        [].slice.call(document.getElementById("wordSourceSettings").getElementsByTagName("input")).forEach(e => {
            if (e.id == "customWordList") {
                return;
            }
            e.checked = false
            e.dispatchEvent(new Event("change"))
        })
        document.getElementById("custom").checked = true
        document.getElementById("custom").dispatchEvent(new Event("change"))
        settings.customWordList = customWordList
        updateWordList()
    });
    [].slice.call(document.getElementById("trainingSettings").getElementsByTagName("input")).forEach(e => {
        if (e.id === "removeAfterVal") {
            e.addEventListener("input", () => {
                if (e.value == "1") {
                    document.getElementById("removeAfterLabel").childNodes[2].data = document.getElementById("removeAfterLabel").childNodes[2].data.replace("ers.", "er.")
                } else {
                    document.getElementById("removeAfterLabel").childNodes[2].data = document.getElementById("removeAfterLabel").childNodes[2].data.replace("er.", "ers.")
                }
                updateSettings()
                updateWordList()
            })
            return;
        }
        e.onclick = () => {
            if (e.id === "removeAfter" && !e.checked) {
                allWords = allWords.map(wordObj => {
                    delete wordObj.removeSessionCorrect
                    return wordObj
                })
            }
            updateSettings();
            updateWordList();
        }
    })
})

await fetch("data.json").then(p => p.text()).then((text) => {
    let data = JSON.parse(text)
    allWords = Object.keys(data).map(w => {
        data[w].character = w
        data[w].correct = 0
        data[w].missed = 0
        data[w].group = 0
        return data[w]
    })
    document.getElementById("maxFrequencyVal").setAttribute("max", "" + allWords.length)
});

let words = allWords
settings.wordData = {}
allWords.forEach(w => {
    settings.wordData[w.character] = {
        correct: 0,
        missed: 0,
        group: 0
    }
})
let wordObj = {}
let acceptableWords = []
let acceptableWordsLeft = []

if (Boolean(window.localStorage.getItem("settings"))) {
    let pastSettings = JSON.parse(window.localStorage.getItem("settings"))
    for (let key in pastSettings) {
        settings[key] = pastSettings[key]
    }
    for (let key in settings) {
        if (key === "customWordList" || key === "wordData") {
            continue;
        } else if (key === "removeAfterVal" || key === "maxFrequencyVal") {
            document.getElementById(key).value = settings[key]
            continue;
        } else if (key === "lower" || key === "upper") {
            document.getElementById(key + "Bound").value = settings[key]
            continue;
        } else if (settings[key]) {
            document.getElementById(key).value = settings["removeAfterVal"]
            document.getElementById(key).checked = true
        } else {
            document.getElementById(key).checked = false
        }
        document.getElementById(key).dispatchEvent(new Event("change"))
    }
    if (Boolean(settings.customWordList)) {
        document.getElementById("custom").checked = true
        document.getElementById("custom").dispatchEvent(new Event("change"))
    }
    if (settings["removeAfterVal"] > 1) {
        document.getElementById("removeAfterLabel").childNodes[2].data = document.getElementById("removeAfterLabel").childNodes[2].data.replace("er.", "ers.")
    }
    allWords = allWords.map(wordObj => {
        let w = wordObj.character
        let wdw = settings.wordData[w]
        if (Boolean(wdw)) {
            wordObj.correct = wdw.correct;
            wordObj.missed = wdw.missed;
            wordObj.group = wdw.group;
            if (Boolean(wdw.removeSessionCorrect)) {
                wordObj.removeSessionCorrect = wdw.removeSessionCorrect
            }
        }
        return wordObj
    })
} else {
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

updateWordList()


function updateWordList() {
    updateSettings()
    words = allWords.filter(w => {
        return (!settings.removeAfter || !Boolean(w.removeSessionCorrect) || w.removeSessionCorrect < settings.removeAfterVal) && (!settings.between || w.pinyin.some(p => p >= settings.lower && p <= settings.upper)) && (!settings.maxFrequency || parseInt(w.freqRank) <= settings.maxFrequencyVal)
    })
    document.getElementById("activeCountLabel").innerText = "Active Word Bank: " + words.length + " words"
    newWord()
}

function updateSettings() {
    for (let key in settings) {
        if (key === "customWordList") {
            continue;
        } else if (key == "removeAfterVal" || key == "maxFrequencyVal") {
            settings[key] = document.getElementById(key).value
            continue;
        } else if (key === "lower" || key === "upper"){
            settings[key] =  document.getElementById(key + "Bound").value
            continue;
        } else if (key === "wordData") {
            allWords.forEach(w => {
                let result =  {
                    correct: w.correct,
                    missed: w.missed,
                    group: w.group
                }
                if (Boolean(w.removeSessionCorrect)) {
                    result.removeSessionCorrect = w.removeSessionCorrect
                }
                settings.wordData[w.character] = result
            })
            continue;
        }
        settings[key] = Boolean(document.getElementById(key).checked)
    }
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

function updateWordCorrect(wordObj, val) {
    settings.wordData[wordObj.character].correct = val
    wordObj.correct = val
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

function updateWordMiss(word, val) {
    settings.wordData[wordObj.character].correct = val
    wordObj.missed = val
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

function updateWordGroupChange(word) {
    settings.wordData[wordObj.character].group = val
    wordObj.group = val
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

function updateWordRemoveSessionCorrect(wordObj, val) {
    settings.wordData[wordObj.character].removeSessionCorrect = val
    wordObj.removeSessionCorrect = val
    window.localStorage.setItem("settings", JSON.stringify(settings))
}

function accentize(text) {
    let chars = "āēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ"
    let tonalIndex = parseInt(text.slice(-1)) - 1
    if (tonalIndex == 4) {
        return text.slice(0, -1)
    }
    let letterIndex = -1
    if (text.includes("a")) {
        letterIndex = 0
    } else if (text.includes("e")) {
        letterIndex = 1
    } else if (text.includes("ou") || text.includes("uo")) {
        letterIndex = 3
    } else {
        letterIndex = "aeiouv".indexOf(text.split("").reverse().find(c => "aeiouv".includes(c)))
    }
    return text.replace("aeiouv".charAt(letterIndex), chars.charAt(tonalIndex * 6 + letterIndex)).slice(0, -1)
}

function isAccented(text) {
    if (text.length == 0) {
        return false
    }
    return text.split("").some(c => "āēīōūǖáéíóúǘǎěǐǒǔǚàèìòùǜ".includes(c)) || text.split("").every(c => !"1234567890".includes(c))
}

newWord()
function newWord() {
    document.getElementById("input").disabled = false
    if (words.length == 0) {
        document.getElementById("input").disabled = true
        return;
    }
    wordObj = words[Math.floor(Math.random() * words.length)]
    let character = wordObj.character
    acceptableWords = [...wordObj.pinyin]
    acceptableWordsLeft = [...wordObj.pinyin]
    document.getElementById("character").innerText = character
}

document.getElementById("input").addEventListener("keyup", (event) => {
    if (event.key !== "Enter") {
        return;
    }
    let messageText = document.getElementById("input").value.trim()
    document.getElementById("input").value = ""
    let label = document.getElementById("label")
    let inputDiv = document.getElementById("inputDiv")
    let convertedAcceptableWords = [...acceptableWords]
    let convertedAcceptableWordsLeft = [...acceptableWordsLeft]
    if (isAccented(messageText)) {
        convertedAcceptableWords = convertedAcceptableWords.map(w => accentize(w))
        convertedAcceptableWordsLeft = convertedAcceptableWordsLeft.map(w => accentize(w))
    }
    if (convertedAcceptableWords.includes(messageText)) {
        label.classList = []
        if (!convertedAcceptableWordsLeft.includes(messageText)) {
            label.innerText = "Variant already typed."
            return;
        }
        acceptableWordsLeft.splice(convertedAcceptableWordsLeft.indexOf(messageText), 1)
        if (acceptableWordsLeft.length > 0) {
            label.innerText = "Type in the variant."
            let newInput = document.createElement("input")
            newInput.value = messageText
            newInput.disabled = true
            inputDiv.insertBefore(newInput, document.getElementById("input"))
            return;
        } else {
            label.innerText = "correct!"
            updateWordCorrect(wordObj, wordObj.correct + 1)
            if (settings.removeAfter) {
                let previous = wordObj.removeSessionCorrect || 0
                updateWordRemoveSessionCorrect(wordObj, previous + 1)
                updateWordList()
            }
            correct += 1;
            streak += 1;
        }
    } else {
        updateWordMiss(wordObj, wordObj.missed + 1)
        label.classList = ["wrong"]
        label.innerText = "Incorrect! the words were " + convertedAcceptableWordsLeft.join(", ") + ". You said: " + messageText
        if (acceptableWords.length > 1) {
            label.innerText += "\nCorrectly typed variants: " + convertedAcceptableWords.filter(w => !convertedAcceptableWordsLeft.includes(w)).join(", ")
        }
        streak = 0;
    }
    inputDiv.replaceChildren(inputDiv.lastElementChild)
    inputDiv.lastElementChild.focus()
    total += 1;
    updateLabel()
    newWord()
});

function updateLabel() {
    let scoreLabel = document.getElementById("score")
    scoreLabel.innerText = "Score: " + correct + "/" + total + ", " + (correct * 100 / total).toFixed(2) + "%"
    let streakLabel = document.getElementById("streak")
    streakLabel.innerText = "Streak: " + streak
}