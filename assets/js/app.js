$(() => {
    let API = null;
    const POST = 'post',
        GET = 'get';


    function chatAjax(query, data = null, method = GET) {
        let options = {
            method: method,
            contentType: 'application/json',
        };
        if (data) {
            if (method === GET) {
                options.data = data;
            } else {
                options.data = JSON.stringify(data);
            }
        }
        return $.ajax(API + query, options)
            .fail((jqXHR) => {
                console.log(jqXHR.responseJSON);
            });
    }

    let Chat = function () {

        // ATTRIBUTES

        this.users = null;
        this.userId = null;
        this.roomId = null;

        this.message = {};

        this.oldestMessage = null;
        this.getMessagesLimit = 20;

        // END ATTRIBUTES


        // FUNCTIONS

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
        this.elements = function (elements = null, path = null) {
            if (!this.elements.list) this.elements.list = {};
            if (elements) {
                for (let [name, val] of Object.entries(elements)) {
                    if (typeof val === 'string') this.addElement(name, val, path);
                    else {
                        this.elements(
                            val[1],
                            this.addElement(name, val[0], path)
                        );
                    }
                }
            }
            return this.elements.list
        };

        /**
         *
         * @param name
         * @param id
         * @param path
         * @returns {jQuery}
         */
        this.addElement = function (name, id, path = null) {
            let element = $('#chat-' + id);
            let list = path ?? this.elements.list;
            if (element.length) {
                return list[name] = element;
            } else {
                this.throwException(`Не найден элемент по id = chat-${id}`);
            }
        }

        this.throwException = function (message) {
            throw message;
        };

        this.toggleOpen = function () {
            if (this.hasClass('closed')) {
                this.removeClass('closed');
                EL.wrapper.show();
                EL.messageTextArea.focus();
                this.trigger('chatOpen');
            } else {
                this.addClass('closed');
                EL.wrapper.hide();
                this.trigger('chatClose');
            }
        }

        this.showFlexEl = function (el = null) {
            el = el ?? this;
            el.addClass('d-flex').show();
            return this;
        }

        this.setDraggable = function () {
            let topPanel = EL.topPanel;
            this.css({
                position: 'fixed',
                bottom: 10,
                right: 10,
            })
                .draggable({
                    handle: EL.topPanel,
                    stack: this,
                    disabled: true,
                    start: function () {
                        topPanel.allowClick = false;
                    },
                    stop: function () {
                        setTimeout(() => { // Не даёт произойти самостоятельному закрытию окна сразу после перетаскивания
                            topPanel.allowClick = true;
                        }, 1);
                    }
                })
                .on('chatOpen', () => {
                    this.draggable('enable');
                })
                .on('chatClose', () => {
                    this.draggable('disable');
                })
                .setFoldable();
        }

        this.setFoldable = function () {
            /* Открывает окно чата при нажатии Ctrl+Shift+ArrowUp TODO: сделать комбинацию клавиш настриваемой */
            $(document).keydown((e) => {
                let keyEvent = e.originalEvent;
                if (keyEvent.keyCode === 38 && keyEvent.shiftKey && keyEvent.ctrlKey) {
                    this.toggleOpen();
                }
            });
            let topPanel = EL.topPanel;
            topPanel.click(() => {
                if (topPanel.allowClick) {
                    this.toggleOpen();
                }
            });
            this.showFlexEl(topPanel);
        }

        /**
         * Разбивает текст на блоки по переносам строки
         * @param text
         * @returns {[]}
         */
        this.splitToDivs = function (text) {
            let result = [];
            for (let paragraph of text.split('\n')) {
                result.push($(`<div>${paragraph}</div>`)[0]);
            }
            return result;
        }

        this.updateFieldHeight = function () {
            // Определяет высоту текстового поля из количества введенных строк
            EL.textAreaHeight.children()
                .replaceWith($('<div>')
                    .append(
                        this.splitToDivs(EL.messageTextArea.val())
                    )
                );
            EL.messageTextArea.height(EL.textAreaHeight.height());
        }

        this.showMessages = function (messages) {
            for (const message of messages) {
                if (message.user_id === 1) {
                    this.systemMessageView(message);
                } else {
                    this.messageView(message);
                }
            }
        }

        /**
         * @param data {{
         *     id: int,
         *     body: string,
         *     timestamp: string,
         *     user_id: int,
         *     replied_to: int | null,
         *     mention: array | int | null,
         *     files: [{
         *          id: string,
         *          name: string|null,
         *      }] | null
         * }}
         */
        this.messageView = function (data) {
            let id = data.id,
                body = data.body,
                timestamp = new Date(data.timestamp),
                userId = data.user_id,
                repliedTo = data.replied_to ?? null,
                mention = data.mention ?? null,
                files = data.files ?? null;

            let h = timestamp.getHours(),
                m = timestamp.getMinutes();

            let div = $('<div class="chat-message d-flex">')
                .data({
                    id: id,
                    userId: userId
                })
                .attr('id', 'chat-message-' + id);

            let leftColumn = $('<div>', {class: 'message-left-col'});

            let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-1">');
            let messageHead = $('<div class="d-flex flex-wrap message-head px-1">');

            let rightColumn = $('<div class="message-right-col d-flex flex-column align-items-center justify-content-end">');

            // Это сообщение мое или чьё-то
            if (userId === parseInt(this.userId)) {
                rightColumn
                    .removeClass('justify-content-end')
                    .addClass('justify-content-between')
                    .append('<div class="my-message d-flex justify-content-center align-items-center">Я</div>');
            } else {
                if (this.users[userId].avatar_url) {
                    leftColumn.append(`<img alt="user" src="${this.users[userId].avatar_url}">`);
                } else {
                    leftColumn.append('<div class="chat-svg chat-user-default">');
                }
                messageHead.text(this.users[userId].displayName);
            }

            // Является ли сообщение ответом кому-то
            if (mention) {
                let mentionDiv = $();
                if (mention instanceof 'int') {
                    mentionDiv = mentionDiv.add(`<a class="message-link">${mention}</a>`);
                } else {
                    div.data('mention', mention);
                    mentionDiv = mentionDiv
                        .add(`<span class="message-mention">пользователям</span>`)
                    //TODO .click();
                }

                messageHead.append($(`<div class="text-end">ответил(а) ${mentionDiv[0]}</div>`));
            }

            // Является ли ответом на сообщение
            if (repliedTo) {
                messageHead
                    .append($('<div class="text-end">&nbsp;на </div>')
                        .append(
                            $('<a class="message-link">сообщение</a>').attr('href', '#message_' + repliedTo)
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
                .append($('<div class="message-body formatted-message-text mt-1 px-1">')
                    .append($('<div>')
                        .append(this.splitToDivs(body))
                    )
                );

            // Время отправки
            rightColumn.append(`<div class="message-timestamp">${h + ':' + m}</div>`);


            div.append(leftColumn, centerColumn, rightColumn);

            // Контекстное меню
            div.contextmenu((e) => this.showContextMenu(e));

            EL.messagesList.prepend(div);
        }

        /**
         * Системное сообщение
         * @param data {{
         *     body: string
         * } | string}
         */
        this.systemMessageView = function (data) {
            let body = data.body ?? data;

            EL.messagesList.prepend($('<div class="chat-message">')
                .addClass('system-message text-center')
                .append(`<div class="formatted-message-text">${body}</div>`));
        }

        this.showContextMenu = function (e) {
            e.preventDefault();
            let messageContextMenu = EL.messageContextMenu,
                menuEdges = {
                    left: e.originalEvent.pageX,
                    top: e.originalEvent.pageY,
                },
                chatEdges = this.offset();
            menuEdges = Object.assign(menuEdges, {
                right: menuEdges.left + messageContextMenu.width(),
                bottom: menuEdges.top + messageContextMenu.height(),
            })
            chatEdges = Object.assign(chatEdges, {
                right: chatEdges.left + this.width(),
                bottom: chatEdges.top + this.height()
            });

            // Чтобы не выходил за края
            if (menuEdges.left < chatEdges.left) menuEdges.left += chatEdges.left - menuEdges.left;
            if (menuEdges.right > chatEdges.right) menuEdges.left -= menuEdges.right - chatEdges.right;
            if (menuEdges.bottom > chatEdges.bottom) menuEdges.top -= menuEdges.bottom - chatEdges.bottom;

            messageContextMenu
                .css({
                    left: menuEdges.left,
                    top: menuEdges.top,
                })
                .data($(e.currentTarget).data('id'))
                .show('fadeIn');
        }

        this.addReply = function (id) {
            this.message.replied_to = id;
            EL.messageAdditional.reply
                .empty()
                .hide()
                .text('В ответ на ')
                .append(
                    $('<a class="message-link">сообщение</a>').attr('href', '#message_' + id)
                )
                .slideDown(200);
        }

        this.addMention = function (user_id) { // TODO
            if (!this.message.mention) this.message.mention = [];
            this.message.mention.push(user_id);
            let mention = EL.messageAdditional.mention;
            mention.text('пользователю ')
                .append(
                    $('<span class="message-mention"></span>').text(this.users[user_id].displayName)
                );
        }


        // REQUESTS

        this.getRoom = function () {
            chatAjax('/room', {
                room_id: this.roomId,
                user_id: this.userId,
                params: {
                    limit: this.getMessagesLimit,
                    id: this.oldestMessage ?? null,
                }
            })
                .done((room) => {
                    if (typeof room === 'object') {
                        if (room.users) {
                            this.users = room.users;
                        } else {
                            this.systemMessageView('В комнату не добавлено ни одного пользователя');
                        }
                        if (room.messages) {
                            this.showMessages(room.messages);
                        } else {
                            this.systemMessageView('Здесь пока нет ни одного сообщения');
                        }
                    } else {
                        this.systemMessageView('Ошибка загрузки комнаты');
                    }
                })
                .fail(() => this.systemMessageView('Ошибка загрузки комнаты'));
        }

        this.getRoomMessages = function () {
            chatAjax('/roomMessages',
                {
                    user_id: this.userId,
                    room_id: this.roomId,
                    params: {
                        limit: this.getMessagesLimit,
                        id: this.oldestMessage ?? null,
                    }
                })
                .done((messages) => {
                    if (typeof messages === 'object') {
                        console.log(messages);
                        //this.oldestMessage = messages[0].id;
                        this.showMessages(messages);
                    } else {
                        this.throwException('Ошибка на стороне сервера');
                    }
                });
        }

        this.sendMessage = function () {
            let body = EL.messageTextArea.val();
            if (body) {
                chatAjax('/sendMessage',
                    Object.assign(this.message, {
                        user_id: this.userId,
                        room_id: this.roomId,
                        body: body
                    }), POST)
                    .done((message) => {
                        this.messageView(message);
                        EL.messageTextArea.val('');
                        EL.messageTextArea.height(EL.textAreaHeight.children()
                            .empty()
                            .height());
                        this.message = {};
                        EL.messageAdditional.reply
                            .empty()
                            .hide();
                    });
            }
        }

        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS & CONSTANTS

        const EL = this.elements({
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
            messageContextMenu: [
                'message-contextmenu',
                {
                    reply: 'message-reply',
                },
            ]
        });

        EL.topPanel.allowClick = true;
        EL.messageAdditional.opened = false;

        // END ELEMENTS & CONSTANTS


        // EVENTS

        EL.messageTextArea
            .on('input', () => this.updateFieldHeight())
            .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendMessage();
                }
            });

        EL.buttonSendMessage.click(() => this.sendMessage());

        let messageContextMenu = EL.messageContextMenu;
        messageContextMenu
            .mouseleave(() => {
                messageContextMenu.hide('slideDown');
            })
            .reply.click(() => this.addReply(messageContextMenu.data('id')));

        let messageAdditional = EL.messageAdditional;
        messageAdditional
            .on('hasAdditions', () => { // TODO возможно бессмысленно
                messageAdditional
                    .slideDown()
                    .opened = true;
            })
            .on('noAdditions', () => { // TODO возможно бессмысленно
                messageAdditional
                    .slideUp()
                    .opened = false;
            });


        // LOAD

        let config = JSON.parse(this.attr('data-config')) ?? null;
        let sessionData = JSON.parse(this.attr('data-session')) ?? null;
        this.removeAttr('data-config')
            .removeAttr('data-session');

        if (config) {
            if (config.apiUrl) {
                API = config.apiUrl;
            } else {
                this.throwException('Отсутствует API URL');
            }

            if (config.draggable) {
                this.setDraggable();
            } else if (config.foldable) {
                this.setFoldable();
            }

            if (config.css) this.css(config.css);

            if (config.dev) {
                window.chat = this;
            }
        }

        if (sessionData) {
            this.userId = sessionData.userId;
            this.roomId = sessionData.roomId;
            this.getRoom();
        } else {
            this.systemMessageView('Ошибка загрузки комнаты');
            this.throwException('Отсутствуют данные о сессии');
        }

        this.show()
            .updateFieldHeight(); //Чтобы не стёртый ранее текст из поля ввода сообщения влиял на высоту блока ввода после обновления страницы
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
});