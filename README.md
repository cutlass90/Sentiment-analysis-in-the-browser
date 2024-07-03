
# Sentiment analysis in the browser. Chrome extension

The demo performs sentiment analysis sentence by sentence and highlight text accordingly to the predicted labels: red - positive, green - negative. 

## Getting Started
1. Install the necessary dependencies:
    ```bash
    npm install 
    ```

1. Build the project:
    ```bash
    npm run build 
    ```

1. Add the extension to your browser. To do this, go to `chrome://extensions/`, enable developer mode (top right), and click "Load unpacked". Select the `build` directory from the dialog which appears and click "Select Folder".

1. That's it! You should now be able to open the extenion's popup and use the model in your browser!
