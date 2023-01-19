import * as alt from 'alt-client';
import { AthenaClient } from '@AthenaClient/api/athena';
import { SYSTEM_EVENTS } from '@AthenaShared/enums/system';
import { WebViewController } from '@AthenaClient/extensions/view2';
import { CHAT_WEBVIEW_EVENTS } from '../shared/events';
import { MessageInfo } from '@AthenaClient/systems/messenger';

const THE_LETTER_T = 84;
const PAGE_NAME = 'Chat';
let hasRegistered = false;

const InternalFunctions = {
    /**
     * Takes any key press and passes it through to the Webview.
     * This is so that the key presses are handled without a 'document.addEventListener'
     * This means the key presses should still work, when not in-focus.
     *
     * @param {number} keyCode
     * @return {*}
     */
    handleKeyPress(keyCode: number) {
        if (AthenaClient.webview.isAnyMenuOpen()) {
            return;
        }

        AthenaClient.webview.emit(CHAT_WEBVIEW_EVENTS.PASS_KEY_PRESS, keyCode);
    },
    /**
     * Fetches and pushes message history, when the chat is opened and turned visible.
     *
     * @param {boolean} [value=true]
     * @return {*}
     */
    updateMessages(value: boolean = true) {
        if (!value) {
            return;
        }

        AthenaClient.webview.emit(CHAT_WEBVIEW_EVENTS.SET_MESSAGES, AthenaClient.messenger.history());
    },
    /**
     * Automatically updates the WebView with latest message history.
     *
     * @param {Array<MessageInfo>} messages
     */
    updateMessagesListener(messages: Array<MessageInfo>) {
        AthenaClient.webview.emit(CHAT_WEBVIEW_EVENTS.SET_MESSAGES, messages);
    },
    /**
     * Opens the message box for commands or messages.
     */
    async openMessageBox() {
        const result = await AthenaClient.rmlui.commandInput.create({
            placeholder: 'Send a message or type a command...',
            commands: AthenaClient.messenger.getCommands(),
        });

        if (typeof result === 'undefined' || result === '') {
            return;
        }

        AthenaClient.messenger.send(result);
    },
    /**
     * Initializes the chat overlay, and registers it as an overlay.
     *
     */
    open() {
        if (!hasRegistered) {
            WebViewController.registerOverlay(PAGE_NAME, InternalFunctions.updateMessages);
            WebViewController.ready(PAGE_NAME, InternalFunctions.updateMessages);
            AthenaClient.messenger.registerHistoryCallback(InternalFunctions.updateMessagesListener);
            alt.on('keyup', InternalFunctions.handleKeyPress);
            hasRegistered = true;
        }
    },
};

AthenaClient.events.onTicksStart.add(() => {
    AthenaClient.events.keyBinds.registerKeybind({ singlePress: InternalFunctions.openMessageBox, key: THE_LETTER_T });
    InternalFunctions.open();
});
