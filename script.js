let controller = null // global AbortController

const submitButton = document.querySelector('#submit')
const stopButton = document.querySelector('#stop')
const outPutElement = document.querySelector('#output')
const inputElement = document.querySelector('input')
const historyElement = document.querySelector('.history')
const clearButton = document.querySelector('button')
const clearChatButton = document.querySelector('#clear-chat')

function changeInput(value) {
    inputElement.value = value
}

function saveHistoryToLocalStorage() {
    const historyItems = Array.from(historyElement.querySelectorAll('p')).map(p => p.textContent)
    localStorage.setItem('chatHistory', JSON.stringify(historyItems))
}

function loadHistoryFromLocalStorage() {
    const saved = localStorage.getItem('chatHistory')
    if (saved) {
        const historyItems = JSON.parse(saved)
        historyItems.forEach(item => {
            const pElement = document.createElement('p')
            pElement.textContent = item
            pElement.addEventListener('click', () => changeInput(item))
            historyElement.append(pElement)
        })
    }
}

async function getMessage() {
    controller = new AbortController()
    outPutElement.textContent = "Loading..."

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "mistral",
                prompt: inputElement.value,
                stream: true
            }),
            signal: controller.signal
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        outPutElement.textContent = ""

        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })

            chunk.split('\n').forEach(line => {
                if (line.trim()) {
                    const json = JSON.parse(line)
                    if (json.response) {
                        outPutElement.textContent += json.response
                        outPutElement.scrollTop = outPutElement.scrollHeight // 👈 Auto-scroll
                    }
                }
            })
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            outPutElement.textContent += "\n\n[Stopped]"
        } else {
            console.error(error)
            outPutElement.textContent = "Something went wrong."
        }
    } finally {
        if (inputElement.value.trim()) {
            const pElement = document.createElement('p')
            pElement.textContent = inputElement.value
            pElement.addEventListener('click', () => changeInput(pElement.textContent))
            historyElement.append(pElement)
            saveHistoryToLocalStorage()
        }
    }
}

submitButton.addEventListener('click', getMessage)

inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        getMessage()
    }
})

stopButton.addEventListener('click', () => {
    if (controller) {
        controller.abort()
    }
})

clearButton.addEventListener('click', () => {
    inputElement.value = ''
})

clearChatButton.addEventListener('click', () => {
    outPutElement.textContent = ''
    historyElement.innerHTML = ''
    localStorage.removeItem('chatHistory')
})

// Load history on page load
window.addEventListener('load', loadHistoryFromLocalStorage)
