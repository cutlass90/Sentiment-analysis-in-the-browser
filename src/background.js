import { pipeline, env } from '@xenova/transformers';

// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;


class PipelineSingleton {
    static task = 'text-classification';
    static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline('sentiment-analysis');
        }

        return this.instance;
    }
}

// Create generic classify function, which will be reused for the different types of events.
const classify = async (text) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    let model = await PipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        // console.log('progress', data)
    });

    // Actually run the model on the input text
    let result = await model(text);
    return result;
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
    // Register a context menu item that will only show up for selection text.
    chrome.contextMenus.create({
        id: 'classify-selection',
        title: 'Classify "%s"',
        contexts: ['selection'],
    });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Ignore context menu clicks that are not for classifications (or when there is no input)
    if (info.menuItemId !== 'classify-selection' || !info.selectionText) return;

    // Perform classification on the selected text
    let result = await classify(info.selectionText);

    // Do something with the result
    chrome.scripting.executeScript({
        target: { tabId: tab.id },    // Run in the tab that the user clicked in
        args: [result],               // The arguments to pass to the function
        function: (result) => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            console.log('result', result)
            console.log('document', document)
        },
    });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
//
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)
    if (message.action === 'classify') {
        // Run model prediction asynchronously
        (async function () {
            // Perform classification
            let result = await classify(message.text);

            // Send response back to UI
            sendResponse(result);
        })();

        // return true to indicate we will send a response asynchronously
        // see https://stackoverflow.com/a/46628145 for more information
        return true;
    } else if (message.action === "fetchAIProbabilities") {
        console.log("Received text for AI probability check:", message.text);

        // Split text into sentences
        const sentences = message.text.split('.').map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);

        // Run sentiment classification asynchronously
        (async function () {
            try {
                // Classify each sentence individually
                const results = await Promise.all(sentences.map(sentence => classify(sentence)));
                console.log("Sentiment classification results:", results);

                // Get probabilities for each sentence
                const probabilities = results.map(result => {
                    let score = result[0].score;
                    if (result[0].label === 'NEGATIVE') {
                        score = 1 - score;
                    }
                    return score;
                });

                sendResponse({ probabilities, sentences });
            } catch (error) {
                console.error('Error:', error);
                sendResponse({ probabilities: [] });
            }
        })();


        return true;  // Will respond asynchronously.
    }
});

//////////////////////////////////////////////////////////////
