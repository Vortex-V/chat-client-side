import Menu from "./modules/Menu.js";
import apiRequests from "./modules/apiRequests.js";
import MessageView from "./modules/MessageView.js";
import Message from "./modules/Message.js";
import UserSearch from "./modules/UserSearch.js";

let Chat = function () {
    let chat = this,
        params = {
            apiUrl: null,
            httpHeaders: null,
            /**
             * @type {{
             *     userId: int,
             *     roomId: int
             * }}
             */
            session: null,
            /**
             * @type {{
             *      id: {
             *         id: int,
             *         displayName: string
             *     }
             * }}
             */
            users: null,
            oldestMessage: null,
            lastMessage: null,
            loadMessagesLimit: 1000,
        };

    /**
     * Осуществляет поиск и сохранение JQuery объектов элементов окна чата
     * @param elements {{
     *              name:'DOM object id',
     *              name: [
     *                  'DOM object id',
     *                  {
     *                      elements
     *                  }
     *              ]
     *          } | null}
     *
     * @param path {object | null}
     * @returns {object} Список полученных элементов
     */
    let elements = chat.elements = function (elements = null, path = null) {
        if (!chat.elements.list) chat.elements.list = {};
        if (elements) {
            for (let [name, val] of Object.entries(elements)) {
                if (typeof val === 'string') chat.elements.addElement(name, val, path);
                else {
                    chat.elements(
                        val[1],
                        chat.elements.addElement(name, val[0], path)
                    );
                }
            }
        }
        return chat.elements.list
    };

    /**
     *
     * @param name
     * @param id
     * @param path
     * @returns {jQuery}
     */
    elements.addElement = function (name, id, path = null) {
        let element = $('#chat-' + id);
        let list = path ?? chat.elements.list;
        if (element.length) {
            return list[name] = element;
        }
    }

    const EL = chat.elements({
        topPanel: 'top-panel',
        wrapper: 'wrapper',
        messageTextArea: 'message-textarea',
        textAreaHeight: 'textarea-height',
        buttonSendMessage: 'send-message',
        messageAdditional: [
            'message-additional',
            {
                file: 'message-additional-file',
                reply: 'message-additional-reply',
                mention: 'message-additional-mention',
            }
        ],
        messagesList: 'messages-list',
        menu: 'menu',
        usersListSide: 'users-list-side',
        showUsersList: 'show-users-list',
        updateMessages: 'update-messages',
    });

    (function chatFunctions() {
        /**
         * @param el
         * @param set
         */
        chat.setLoading = function (set, el = chat) {
            el.toggleClass('chat-loading', set)
            return chat;
        }

        chat.setDraggable = function () {
            let topPanel = EL.topPanel;
            chat.css({
                position: 'fixed',
            })
                .draggable({
                    handle: EL.topPanel,
                    stack: chat,
                    disabled: true,
                    start: () => {
                        chat.css({
                            right: 'auto',
                            bottom: 'auto',
                        });
                        topPanel.off('click', chat.toggleOpen);
                    },
                    stop: () => {
                        setTimeout(() => { // Не даёт произойти самостоятельному закрытию окна сразу после перетаскивания
                            topPanel.click(chat.toggleOpen);
                        }, 1);
                    }
                })
                .on('chatOpen', () => {
                    chat.draggable('enable');
                })
                .on('chatClose', () => {
                    chat.draggable('disable');
                })
                .setFoldable();
        }

        chat.setFoldable = function () {
            /* Открывает окно чата при нажатии Ctrl+Shift+ArrowUp TODO: сделать комбинацию клавиш настриваемой */
            $(document).keydown((e) => {
                let keyEvent = e.originalEvent;
                if (keyEvent.keyCode === 38 && keyEvent.shiftKey && keyEvent.ctrlKey) {
                    chat.toggleOpen();
                }
            });
            EL.topPanel.click(chat.toggleOpen)
                .addClass('d-flex').show();
        }

        chat.toggleOpen = function () {
            if (chat.hasClass('closed')) {
                chat.removeClass('closed');
                EL.wrapper.show();
                EL.messageTextArea.focus();
                chat.trigger('chatOpen');
            } else {
                chat.addClass('closed');
                EL.wrapper.hide();
                chat.trigger('chatClose');
            }
        }

        /**
         * @param data {{
         *     type: 'manually'|'automatically',
         *     timeout: int | null
         * } | 'manually'}
         */
        chat.setMessagesUpdateMethod = function (data) {
            let type = data.type ?? data,
                timeout = data.timeout ?? 5000;
            let click = () => {
                chat.loadMessages('prepend');
                setTimeout(() => {
                    EL.updateMessages.one('click', click)
                }, timeout);
            }
            let methods = {
                manually: () => {
                    EL.updateMessages
                        .one('click', click)
                        .addClass('d-flex')
                        .show()
                },
                automatically: () => setInterval(() => {
                    chat.updateMessages();
                }, timeout),
            };
            if (Object.keys(methods).includes(type)) methods[type]();
        }

        /**
         * Разбивает текст на блоки по переносам строки
         * @param text
         * @returns {[]}
         */
        chat.splitToDivs = function (text) {
            let result = [];
            for (let paragraph of text.split('\n')) {
                result.push(`<div>${paragraph}</div>`);
            }
            return result;
        }

        chat.updateFieldHeight = function () {
            // Определяет высоту текстового поля из количества введенных строк
            EL.textAreaHeight.children()
                .replaceWith($('<div>')
                    .append(
                        chat.splitToDivs(EL.messageTextArea.val())
                    )
                );
            EL.messageTextArea.height(EL.textAreaHeight.height());
        }

        /**
         * Допишет сообщения в список
         * @param data {{}|[]}
         * @param insertMethod {'prepend'|'append'}
         */
        chat.showMessages = function (data, insertMethod = 'append') {
            EL.messagesList[insertMethod](chat.messageCollection(data));
        }

        /**
         * Допишет сообщение в список
         * @param data {{}|[]}
         * @param insertMethod {'prepend'|'append'}
         * @param type {'user'|'system'|'date'}
         */
        chat.showMessage = function (data, insertMethod = 'append', type = 'user') {
            EL.messagesList[insertMethod](chat.messageOne(data, type));
        }
    })();

    (function load() {
        let modules = [];
        for (let module of [
            apiRequests,
            Menu,
            MessageView,
            Message,
            UserSearch
        ]) {
            modules.push(module(chat));
        }
        $.extend(chat, params, ...modules);

        chat.apiUrl = chat.data('api-url');
        if (!chat.apiUrl) {
            throw new Error('Отсутствует API URL');
        }

        /**
         * @type {{
         *     userId: int,
         *     roomId: int
         * } | object}
         */
        chat.session = chat.data('session');
        if (!chat.session) {
            chat.showMessages('Ошибка загрузки комнаты', "prepend", "system");
            throw new Error('Отсутствуют данные о сессии');
        }

        /**
         * @type {{
         *     draggable: boolean|null,
         *     foldable: boolean|null,
         *     class: string,
         *     css: object|null,
         *     updateMessages: object|string|null,
         *     getMessagesLimit: int,
         *     dev: boolean|null
         * }|null}
         */
        let config = chat.data('config');
        if (config) {
            for (const param in params) {
                if (config[param]) {
                    chat[param] = config[param];
                }
            }

            if (config.draggable) {
                chat.setDraggable();
            } else if (config.foldable) {
                chat.setFoldable();
            }

            if (config.class) chat.addClass(config.class);
            if (config.css) chat.css(config.css);

            config.updateMessages ?
                chat.setMessagesUpdateMethod(config.updateMessages)
                : chat.setMessagesUpdateMethod('manually');

            if (config.dev) window.chat = chat;
        }

        chat.setLoading(true, EL.wrapper)
            .show()
            .getRoom()
            .done(function setEvents() {
                EL.messageTextArea
                    .on('input', () => chat.updateFieldHeight())
                    .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                        if (e.key === 'Enter' && e.ctrlKey) {
                            chat.sendMessage();
                        }
                    });

                EL.buttonSendMessage.click(() => chat.sendMessage());

                let wait = false;
                EL.messagesList.parent('.scrollable').on('scroll', e => {
                    let el = e.currentTarget;
                    if (el.scrollTop + 400 >= el.scrollTopMax && !wait) {
                        wait = true;
                        chat.setLoading(true, EL.wrapper);
                        chat.loadMessages('append').done(() => {
                            wait = false;
                            chat.setLoading(false, EL.wrapper);
                        });
                    }
                });

                EL.showUsersList
                    .click(() => {
                        EL.usersListSide.toggleClass('showed')
                        EL.showUsersList.children().toggle();
                    })
                    .one('click', () => {
                        chat.setLoading(true, EL.usersListSide);
                        let list = [];
                        for (const [id, user] of Object.entries(chat.users)) {
                            list.push(
                                $('<li class="d-flex align-items-center py-2 px-3">')
                                    .append('<div class="chat-svg chat-user-default-1 mr-2">', user.displayName)
                                    .data('id', id)
                                    .contextmenu((e) => chat.showMenu(e, 'actions', ['mention']))
                            );
                        }
                        EL.usersListSide.append(list);
                        chat.setLoading(false, EL.usersListSide);
                    });

                chat.initMessageForSend();
                chat.initUserSearch();
            })
            .always(() => {
                chat.setLoading(false, EL.wrapper);
            })
        chat.updateFieldHeight() //Чтобы не стёртый ранее текст из поля ввода сообщения влиял на высоту блока ввода после обновления страницы

    })();
}

Chat.prototype = $('#chat');

new Chat();


//DEV

/**
 * @param fn
 */
function time(fn) {
    console.time('function');
    let res = fn();
    console.timeEnd('function');
    return res;
}