let allWords = []
let total = 0;
let correct = 0;
let streak = 0;

console.log(window.localStorage.getItem("settings"))

let settings = {
    customWordList: null,
    removeAfter: false,
    removeAfterVal: 1,
    wordData: null
}

document.addEventListener("DOMContentLoaded", () => {
    //init settings
    [].slice.call(document.getElementById("wordListSettingsDiv").getElementsByTagName("input")).forEach(element => {
        if (element.id == "customWordList") {
            return;
        }
        element.onclick = () => {
            updateWordList()
            if (element.id == "all" && element.checked) {
                [].slice.call(document.getElementById("wordListSettings").getElementsByTagName("input")).forEach(element => {
                    element.checked = true;
                    element.dispatchEvent(new Event("change"))
                })
            } else if (element.parentElement.id == "wordListSettings" && element.id != "all" && !element.checked) {
                document.getElementById("all").checked = false
                document.getElementById("all").dispatchEvent(new Event("change"))
                updateWordList()
            }
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
        } else if (key === "removeAfterVal") {
            document.getElementById(key).value = settings["removeAfterVal"]
        }
        if (settings[key]) {
            console.log(key)
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
    updateWordList()
} else {
    window.localStorage.setItem("settings", JSON.stringify(settings))
}



function updateWordList() {
    updateSettings()
    words = allWords.filter(w => {
        return (!settings.removeAfter || !Boolean(w.removeSessionCorrect) || w.removeSessionCorrect < settings.removeAfterVal)
    })
    newWord()
}

function updateSettings() {
    for (let key in settings) {
        if (key === "customWordList") {
            continue;
        } else if (key == "removeAfterVal") {
            settings[key] = document.getElementById(key).value
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
    if (parseInt(wordObj.freqRank) > 5000) {
        newWord()
        return;
    }
}

document.getElementById("input").addEventListener("keyup", (event) => {
    if (event.key !== "Enter") {
        return;
    }
    let messageText = document.getElementById("input").value.replace("'", "’").trim()
    document.getElementById("input").value = ""
    let label = document.getElementById("label")
    let inputDiv = document.getElementById("inputDiv")
    if (acceptableWords.includes(messageText)) {
        label.classList = []
        if (!acceptableWordsLeft.includes(messageText)) {
            label.innerText = "Variant already typed."
            return;
        }
        acceptableWordsLeft.splice(acceptableWordsLeft.indexOf(messageText), 1)
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
        label.innerText = "Incorrect! the words were " + acceptableWordsLeft.join(", ") + ". You said: " + messageText
        if (acceptableWords.length > 1) {
            label.innerText += "\nCorrectly typed variants: " + acceptableWords.filter(w => !acceptableWordsLeft.includes(w)).join(", ")
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