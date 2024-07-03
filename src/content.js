// Function to extract text from the page and limit it to 50,000 characters
function extractText() {
  const fullText = document.body.innerText.replace(/\s+/g, ' ').trim();
  const limitedText = fullText.substring(0, 50000);
  return limitedText;
}



// Function to interpolate color between green and red based on probability
function getColor(probability) {
  const red = Math.floor(255 * probability);
  const green = Math.floor(255 * (1 - probability));
  return `rgb(${red},${green},0)`;
}

// Function to highlight text
function highlightText(probabilities, sentences) {
  if (!sentences) {
    console.error("No sentences found.");
    return;
  }

  sentences.forEach((sentence, index) => {
    const probability = probabilities[index];
    const color = getColor(probability);

    const span = document.createElement('span');
    span.style.textDecoration = 'underline';
    span.style.textDecorationColor = color;
    span.textContent = sentence;

    // Safely replace text in the node
    safelyReplaceTextInNode(document.body, sentence, span);
  });
}

// Function to safely replace text in a node with a span
function safelyReplaceTextInNode(node, searchText, span) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
  let currentNode;

  while (currentNode = walker.nextNode()) {
    const index = currentNode.nodeValue.indexOf(searchText);
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(currentNode, index);
      range.setEnd(currentNode, index + searchText.length);

      range.deleteContents();
      range.insertNode(span.cloneNode(true));
      return;
    }
  }
}


const text = extractText();
console.log("Extracted text:", text);

chrome.runtime.sendMessage({ action: "fetchAIProbabilities", text }, response => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
  } else {
    console.log("Received response:", response);
    highlightText(response.probabilities, response.sentences);
  }
});