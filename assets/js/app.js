$(() => {
    let Chat = function () {
        let chat = this;

        chat.extend({
            apiUrl: null,
            session: {
                userId: null,
                roomId: null
            },
            users: null,
            message: {},
            oldestMessage: null,
            lastMessage: null,
            getMessagesLimit: 1000,
        });

        (function elements() {
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
        })();

        (function chatFunctions() {
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
             *     interval: int | null
             * } | 'manually'}
             */
            chat.setMessagesUpdateMethod = function (data) {
                let methods = {
                    manually: () => {
                        EL.updateMessages
                            .click(() => chat.updateMessages())
                            .addClass('d-flex')
                            .show()
                    },
                    automatically: (interval) => setInterval(() => {
                        chat.updateMessages();
                    }, interval),
                };
                let type = data.type ?? data,
                    interval = data.interval ?? 5000;
                if (Object.keys(methods).includes(type)) methods[type](interval);
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

            chat.loadUsersListSide = function () {
                let list = [];
                for (const [id, user] of Object.entries(chat.users)) {
                    list.push(
                        $('<li class="d-flex align-items-center py-2 px-3">')
                            .append('<div class="chat-svg chat-user-default-1 mr-2">', user.displayName)
                            .data('id', id)
                            .contextmenu((e) => chat.showContextMenu(e, 'user'))
                    );
                }
                EL.usersListSide.append(list);
            }

            /**
             * @param ids {[int]}
             * @returns {string}
             */
            chat.loadUsersList = function (ids) {
                return EL.usersList;
            }

            chat.showContextMenu = function (e, type) {
                e.preventDefault();
                let chatEdges = chat.offset();
                chatEdges = Object.assign(chatEdges, {
                    right: chatEdges.left + chat.width(),
                    bottom: chatEdges.top + chat.height()
                });
                chat.contextMenu(e, type, chatEdges);
            }

            chat.addReply = function (id) {
                chat.message.replied_to = id;
                EL.messageAdditional.reply
                    .empty()
                    .hide()
                    .text('В ответ на ')
                    .append(
                        $('<a class="message-link">сообщение</a>').attr('href', '#chat-message-' + id)
                    )
                    .slideDown(200);
            }

            chat.addMention = function (user_id) { // TODO
                let mentionBlock = EL.messageAdditional.mention
                if (!chat.message.mention) {
                    chat.message.mention = [];
                    mentionBlock
                        .text('пользователю ')
                        .append(
                            $(`<span class="message-mention">${chat.users[user_id].displayName}</span>`)
                        );
                } else if (!chat.message.mention.includes(user_id)) {
                    mentionBlock
                        .empty()
                        .hide()
                        .append(`в ответ <span class="message-mention">пользователям</span>`); //TODO click
                }
                chat.message.mention.push(user_id);
                mentionBlock.slideDown(200);
            }
        })();

        (function messageFunctions() {
            /**
             * Допишет в список сообщений переданные сообщения
             * @param messages
             */
            chat.showMessages = function (messages) {
                let date = '',
                    currentDate = (new Date()).toDateString(),
                    list = [];
                for (const message of messages) {
                    if (date !== message.timestamp.date) {
                        date = message.timestamp.date;
                        if ((new Date(date)).toDateString() !== currentDate) { // TODO перенести проверку
                            list.push(chat.systemMessageView(date, true));
                        }
                    }
                    if (message.user_id === 1) {
                        list.push(chat.systemMessageView(message));
                    } else {
                        list.push(chat.messageView(message));
                    }
                }
                EL.messagesList.append(list);
            }

            /**
             * Допишет сообщение в список
             * @param data
             * @param insertMethod {'prepend'|'append'}
             * @param type {'system'|''}
             */
            chat.showMessage = function (data, insertMethod, type = '') {
                let message;
                if (type === 'system') {
                    message = chat.systemMessageView(data);
                } else {
                    message = chat.messageView(data);
                }
                if (insertMethod === 'prepend') {
                    EL.messagesList.prepend(message);
                } else if (insertMethod === 'append') {
                    EL.messagesList.append(message);
                }
            }

            /**
             * @param data {{
             *     id: int,
             *     body: string,
             *     timestamp: {
             *         date: string,
             *         time: string
             *     },
             *     user_id: int,
             *     replied_to: int | null,
             *     mention: array | null,
             *     files: [{
             *          id: string,
             *          name: string|null,
             *      }] | null
             * }}
             */
            chat.messageView = function (data) {
                let id = data.id,
                    body = data.body,
                    time = data.timestamp.time,
                    userId = data.user_id,
                    repliedTo = data.replied_to ?? null,
                    mention = data.mention ?? null,
                    files = data.files ?? null;

                let div = $('<div class="chat-message d-flex">')
                    .data({
                        id: id,
                        userId: userId
                    })
                    .attr('id', 'chat-message-' + id);

                let leftColumn = $('<div>', {class: 'message-left-col'});

                let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-2">');
                let messageHead = $('<div class="d-flex flex-wrap message-head">');

                let rightColumn = $('<div class="message-right-col d-flex flex-column align-items-center justify-content-end">');

                // Это сообщение мое или чьё-то
                let target, deflt = '1';
                if (userId === parseInt(chat.session.userId)) {
                    target = rightColumn
                        .removeClass('justify-content-end')
                        .addClass('justify-content-between');
                    deflt = 2
                    div.addClass('my-message');
                } else {
                    target = leftColumn;
                    messageHead.text(chat.users[userId].displayName + ' ');
                }
                if (chat.users[userId].avatar_url) {
                    target.append(`<img alt="user" src="${chat.users[userId].avatar_url}">`);
                } else {
                    target.append(`<div class="chat-svg chat-user-default-${deflt}">`);
                }

                // Является ли сообщение ответом кому-то
                if (mention.length) {
                    let mentionDiv;
                    if (mention.length === 1) {
                        mentionDiv = $(`<span class="message-mention">${chat.users[mention[0]].displayName}</span>`);
                    } else {
                        div.data('mention', mention);
                        mentionDiv = $(`<span class="message-link">пользователям</span>`)
                        //TODO .click();
                    }

                    messageHead.append($(`<div class="text-end small">ответил(а) </div>`).append(mentionDiv));
                }

                // Является ли ответом на сообщение
                if (repliedTo) {
                    messageHead
                        .append($('<span class="small">на </span>')
                            .append(
                                $('<a class="message-link">сообщение</a>').attr('href', '#chat-message-' + repliedTo)
                            )
                        );
                }

                centerColumn.append(messageHead)

                // Прикрепленные файлы
                if (files) {
                    for (let file of files) {
                        centerColumn.append(`<div class="message-attached-file">file_${file.id}${" | " + file.name ?? ""}</div>`);
                    }
                }
                // Текст сообщения
                centerColumn
                    .append($('<div class="message-body formatted-message-text mt-1">')
                        .append($('<div>')
                            .append(chat.splitToDivs(body))
                        )
                    );

                // Время отправки
                rightColumn.append(`<div class="message-timestamp">${time}</div>`);


                div.append(leftColumn, centerColumn, rightColumn);

                // Контекстное меню
                div.contextmenu((e) => chat.showContextMenu(e, 'message'));

                return div;
            }

            /**
             * Системное сообщение
             * @param data {{
             *     body: string
             * } | string}
             * @param date {boolean}
             */
            chat.systemMessageView = function (data, date = false) {
                let body = data.body ?? data;

                let div = $('<div class="system-message chat-message text-muted text-center">')
                    .append(`<div class="formatted-message-text">${body}</div>`)

                if (date) div.addClass('chat-messages-date small')

                return div;
            }
        })();

        (function contextMenu() {
            /**
             * Отобразит контекстное меню указанного типа
             * @param e
             * @param type {'message'|'user'}
             * @param chatEdges {{
             *     left: int,
             *     right: int,
             *     bottom: int,
             *     top: int
             * }}
             */
            let contextMenu = chat.contextMenu = function (e, type, chatEdges) { // TODO подумать над структурой
                switch (type) {
                    case "message": contextMenu.forMessage(e, chatEdges); break;
                    case "user": contextMenu.forUser(e, chatEdges); break;
                }
            }

            contextMenu.forUser = function (e, chatEdges) {
                this.setPosition(e, EL.usersContextMenu, chatEdges)
                    .data('id', $(e.currentTarget).data('id'))
                    .show('fadeIn');
            }

            contextMenu.forMessage = function (e, chatEdges) {
                this.setPosition(e, EL.messageContextMenu, chatEdges)
                    .data('id', $(e.currentTarget).data('id'))
                    .show('fadeIn');
            };

            contextMenu.setPosition = function (e, menu, chatEdges) {
                let edges = {
                    left: e.originalEvent.pageX,
                    top: e.originalEvent.pageY,
                };
                edges = Object.assign(edges, {
                    right: edges.left + menu.width(),
                    bottom: edges.top + menu.height(),
                })

                // Чтобы не выходил за края
                if (edges.left < chatEdges.left) edges.left += chatEdges.left - edges.left;
                if (edges.right > chatEdges.right) edges.left -= edges.right - chatEdges.right;
                if (edges.bottom > chatEdges.bottom) edges.top -= edges.bottom - chatEdges.bottom;
                return menu
                    .css({
                        left: edges.left,
                        top: edges.top,
                    })
            }
        })();

        (function apiRequests() {
            /**
             * @param query {string}
             * @param data {object|null}
             * @param method {'GET'|'POST'}
             * @returns {*}
             */
            let ajax = chat.chatAjax = function (query, data = null, method = "GET") {
                let options = {
                    method: method,
                    contentType: 'application/json',
                };
                let defaults = {
                    room_id: chat.session.roomId,
                    user_id: chat.session.userId
                }
                data ?
                    data = Object.assign(defaults, data)
                    : data = defaults;
                method === "GET" ?
                    options.data = data
                    : options.data = JSON.stringify(data);
                return $.ajax(chat.apiUrl + query, options)
                    .fail((response) => {
                        console.log(response);
                    });
            }

            chat.getRoom = function () {
                ajax('/room', {
                    params: {
                        limit: chat.getMessagesLimit,
                    }
                })
                    .done(
                        /**
                         * @param room {{
                         *     users: {
                         *          id: {
                         *              display_name: string
                         *          }
                         *     },
                         *     messages: array
                         * }}
                         */
                        (room) => {
                            if (typeof room === 'object') {
                                if (room.users) {
                                    chat.users = room.users;
                                } else {
                                    chat.showMessage('В комнату не добавлено ни одного пользователя', "prepend", "system");
                                }
                                if (room.messages) {
                                    time(() => {
                                        chat.showMessages(room.messages);
                                    });

                                } else {
                                    chat.showMessage('Здесь пока нет ни одного сообщения', "prepend", "system");
                                }
                            } else {
                                chat.showMessage('Ошибка загрузки комнаты', "prepend", "system");
                            }
                        })
                    .fail(() => chat.showMessage('Ошибка загрузки комнаты', "prepend", "system"));
            }

            chat.getRoomMessages = function () {
                ajax('/roomMessages', {
                    params: {
                        limit: chat.getMessagesLimit,
                        last_id: chat.lastMessage ?? null,
                        oldest_id: chat.oldestMessage ?? null,
                    }
                })
                    .done((messages) => {
                        if (typeof messages === 'object') {
                            console.log(messages);
                            //chat.oldestMessage = messages[0].id;
                            chat.showMessages(messages);
                        } else {
                            throw new Error('Ошибка на стороне сервера');
                        }
                    });
            }

            chat.sendMessage = function () {
                let body = EL.messageTextArea.val();
                if (body) {
                    ajax('/sendMessage',
                        Object.assign(chat.message, {
                            body: body
                        }), "POST")
                        .done((message) => {
                            chat.showMessage(message, "prepend");
                            EL.messageTextArea.val('');
                            EL.messageTextArea.height(EL.textAreaHeight.children()
                                .empty()
                                .height());
                            chat.message = {};
                            EL.messageAdditional.reply
                                .empty()
                                .hide();
                            EL.messageAdditional.mention
                                .empty()
                                .hide();
                        });
                }
            }

            chat.updateMessages = function () {
                ajax('/updateMessages')
                    .done((messages) => {
                        if (typeof messages === 'object') {
                            chat.showMessages(messages); // TODO prepend
                        } else {
                            throw new Error('Ошибка на стороне сервера');
                        }
                    });
            }
        })()

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
            usersContextMenu: [
                'users-contextmenu',
                {
                    mention: 'user-mention'
                }
            ],
            usersListSide: 'users-list-side',
            showUsersList: 'show-users-list',
            updateMessages: 'update-messages',
            messageContextMenu: [
                'message-contextmenu',
                {
                    reply: 'message-reply',
                },
            ]
        });

        (function events() {
            EL.messageTextArea
                .on('input', () => chat.updateFieldHeight())
                .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                    if (e.key === 'Enter' && e.ctrlKey) {
                        chat.sendMessage();
                    }
                });

            EL.buttonSendMessage.click(() => chat.sendMessage());

            let messageContextMenu = EL.messageContextMenu;
            messageContextMenu
                .mouseleave(() => {
                    messageContextMenu.hide('slideDown');
                })
                .reply.click(() => chat.addReply(messageContextMenu.data('id')));

            let usersContextMenu = EL.usersContextMenu;
            usersContextMenu
                .mouseleave(() => {
                    usersContextMenu.hide('slideDown');
                })
                .mention.click(() => chat.addMention(usersContextMenu.data('id')));

            EL.showUsersList
                .click(() => EL.usersListSide.toggleClass('showed'))
                .one('click', () => chat.loadUsersListSide());
        })();

        (function load() {
            chat.apiUrl = chat.data('api-url')
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
            if (chat.session) {
                chat.getRoom();
            } else {
                chat.showMessage('Ошибка загрузки комнаты', "prepend", "system");
                throw new Error('Отсутствуют данные о сессии');
            }

            /**
             * @type {{
             *     draggable: boolean|null,
             *     foldable: boolean|null,
             *     css: object|null,
             *     updateMessages: object|string|null,
             *     getMessagesLimit: int,
             *     dev: boolean|null
             * }|null}
             */
            let config = chat.data('config');
            if (config) {
                if (config.getMessagesLimit){
                    chat.getMessagesLimit = config.getMessagesLimit;
                }

                if (config.draggable) {
                    chat.setDraggable();
                } else if (config.foldable) {
                    chat.setFoldable();
                }

                if (config.css) chat.css(config.css);

                config.updateMessages ?
                    chat.setMessagesUpdateMethod(config.updateMessages)
                    : chat.setMessagesUpdateMethod('manually');

                if (config.dev) window.chat = chat;
            }

            chat.show()
                .updateFieldHeight(); //Чтобы не стёртый ранее текст из поля ввода сообщения влиял на высоту блока ввода после обновления страницы
        })()
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

    function threeHundred() {
        for (let i = 0; i < 300; i++) {
            chat.chatAjax('/sendMessage', {
                body: strRand(300)
            }, "POST");
        }
        return true;
    }

    function strRand(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }
});