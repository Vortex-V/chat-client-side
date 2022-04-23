$(() => {
    const API = 'http://chat.api.click2mice.local',
        POST = 'post',
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

        this.dev = false;

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

        this.toggleOpen = function (triggerEvents = true) {
            if (this.hasClass('closed')) {
                this.removeClass('closed');
                if (triggerEvents) this.trigger('chatOpen');
            } else {
                this.addClass('closed');
                if (triggerEvents) this.trigger('chatClose');
            }
        }

        this.setDraggable = function () {
            this.draggable({
                handle: EL.topPanel,
                stack: this,
                disabled: true,
                start: function () {
                    topPanel.allowClick = false;
                },
                stop: function () {
                    setTimeout(() => { // Не даёт произойти автоматическому закрытию окна сразу после перетаскивания
                        topPanel.allowClick = true;
                    }, 1);
                }
            });
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

        this.loadMessages = function (messages) {
            messages.forEach((message) => {
                this.messageView(message);
            })
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
                timestamp = data.timestamp,
                user_id = data.user_id,
                replied_to = data.replied_to ?? null,
                mention = data.mention ?? null,
                files = data.files ?? null;
            let div = $('<div class="chat-message">').data({
                id: id,
                user_id: user_id
            });

            if (user_id === 1) { // Значит это системное сообщение
                div.addClass('system-message text-center').append(`<div class="formatted-message-text">${body}</div>`);
            } else {
                div
                    .attr('id', 'message_' + id)
                    .addClass('d-flex');

                let leftColumn = $('<div>', {class: 'message-left-col'});

                let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-1">');
                let messageHead = $('<div class="d-flex flex-wrap message-head px-1">');

                let rightColumn = $('<div class="message-right-col d-flex flex-column align-items-center justify-content-end">');

                // Это сообщение мое или чьё-то
                if (user_id === this.userId) {
                    rightColumn
                        .removeClass('justify-content-end')
                        .addClass('justify-content-between')
                        .append('<div class="my-message d-flex justify-content-center align-items-center">Я</div>');
                } else {
                    leftColumn.append('<img alt="user" src="/assets/files/users_default_avatars/User%20avatar.svg">'); //TODO получать src у пользователя или подумать ещё раз
                    messageHead.text(this.users[user_id].displayName);
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
                if (replied_to) {
                    messageHead
                        .append($('<div class="text-end">на </div>')
                            .append(
                                $('<a class="message-link">сообщение</a>').attr('href', '#message_' + replied_to)
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
                rightColumn.append(`<div class="message-timestamp">${timestamp}</div>`);


                div.append(leftColumn, centerColumn, rightColumn);

                // Контекстное меню
                div.contextmenu(this.showContextMenu);
            }

            EL.messagesList.prepend(div);
        }

        this.showContextMenu = function (e) {
            e.preventDefault();
            let x = e.originalEvent.layerX,
                y = e.originalEvent.layerY,
                messagesList = EL.messagesList,
                messageContextMenu = EL.messageContextMenu;
            while (messagesList.width() - x < 250) {
                x -= 30;
            }
            let message = $(e.currentTarget);
            messageContextMenu
                .css({
                    left: x,
                    top: y,
                })
                .data(message.data())
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

        this.addMention = function (e, user_id) { // TODO
            if (!this.message.mention) this.message.mention = [];
            this.message.mention.push(user_id);
            let mention = EL.messageAdditional.mention;
            mention.text('пользователю ')
                .append(
                    $('<span class="message-mention"></span>').text(this.users[user_id].displayName)
                );
        }

        // КОСТЫЛЬ

        this.getTime = function () {
            d = new Date();
            h = d.getHours();
            h / 10 < 1 ? h = '0' + h : h;
            m = d.getMinutes();
            m / 10 < 1 ? m = '0' + m : m;
            return h + ':' + m;
        }

        // END КОСТЫЛЬ


        // REQUESTS
        this.getRoomMessages = function () {
            chatAjax('/roomMessages',
                {
                    user_id: this.userId,
                    room_id: this.roomId,
                    params: {
                        limit: 20,
                        page: 1,
                    }
                })
                .done((messages) => {
                    if (typeof messages === 'object') {
                        sessionStorage.messages = JSON.stringify(messages);
                    } else {
                        this.throwException('Ошибка на стороне сервера');
                    }
                });
        }

        this.sendMessage = function () {
            let body = EL.messageTextArea.val();
            if (body) {
                let message = this.message;
                if (message.replied_to) {
                    let repliedMessageUserId = $('#message_' + message.replied_to).data('user_id');
                    if (!message.mention) message.mention = [];
                    message.mention.push(repliedMessageUserId);
                }
                chatAjax('/sendMessage',
                    Object.assign(message, {
                        user_id: this.userId,
                        room_id: this.roomId,
                        body: body
                    }),
                    POST)
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

        this.getRoomUsers = function () {
            chatAjax('/roomUsers', {
                room_id: this.roomId,
            })
                /** @param users {{
                 *      id: {
                 *          id: int,
                 *          displayName: string,
                 *      }
                 *  }}
                 * */
                .done((users) => {
                    if (typeof users === 'object') {
                        sessionStorage.setItem('users', JSON.stringify(users));
                    } else {
                        this.throwException('Ошибка на стороне сервера');
                    }
                });
        }

        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS & CONSTANTS

        const EL = this.elements({
            topPanel: 'top-panel',
            messageTextArea: 'message-textarea',
            textAreaHeight: 'textarea-height',
            messagesList: 'messages-list',
            buttonSendMessage: 'send-message',
            messageContextMenu: [
                'message-contextmenu',
                {
                    reply: 'message-reply',
                },
            ],
            messageAdditional: [
                'message-additional',
                {
                    file: 'message-additional-file',
                    reply: 'message-additional-reply',
                    mention: 'message-additional-mention',
                }
            ]
        });

        const ON_LOAD = [
            'dev',
            'toggleOpen',
            'setDraggable',
        ];

        EL.topPanel.allowClick = true;
        EL.messageAdditional.opened = false;

        // END ELEMENTS & CONSTANTS


        // EVENTS

        /* Открывает окно чата при нажатии Ctrl+Shift+ArrowUp
        TODO: сделать комбинацию клавиш настриваемой */
        $(document).keydown((e) => {
            let keyEvent = e.originalEvent;
            if (keyEvent.keyCode === 38 && keyEvent.shiftKey && keyEvent.ctrlKey) {
                this.toggleOpen();
            }
        });

        this
            .on('chatOpen', () => {
                    EL.messageTextArea.focus();
                    this.draggable('enable');
                },
            )
            .on('chatClose', () => {
                this.draggable('disable');
            });

        EL.messageTextArea
            .on('input', () => this.updateFieldHeight())
            .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendMessage();
                }
            });

        let topPanel = EL.topPanel;
        topPanel.click(() => {
            if (topPanel.allowClick) {
                this.toggleOpen();
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
        this.removeAttr('data-config');
        if (config) {
            if (config.css) this.css(config.css);
            if (config.attributes) {
                Object.entries(config.attributes).forEach(([attr, val]) => {
                    if (ON_LOAD.includes(attr)) {
                        this[attr] = val;
                    }
                })
            }
            if (config.onLoad) {
                Object.entries(config.onLoad).forEach(([fu, args]) => {
                    if (ON_LOAD.includes(fu)) {
                        this[fu](...args ?? null)
                    }
                })
            }
        }

        let sessionData = JSON.parse(this.attr('data-session')) ?? null;
        if (sessionData) {
            this.userId = sessionData.userId;
            this.roomId = sessionData.roomId;
            if (sessionStorage.path !== location.pathname) {
                this.getRoomUsers(); // устанавливает sessionStorage.users
                this.getRoomMessages(); // устанавливает sessionStorage.messages
                sessionStorage.path = location.pathname;
            }
            this.users = sessionStorage.users ? JSON.parse(sessionStorage.users) : null;
            if (sessionStorage.messages) {
                this.loadMessages(JSON.parse(sessionStorage.messages)); // TODO привязать к событию
            }
        } else {
            this.throwException('Отсутствуют данные о сессии');
        }

        this.removeAttr('data-session');
        this.updateFieldHeight(); //Чтобы не стёртый ранее текст из поля ввода сообщения влиял на высоту блока ввода после обновления страницы

        if (this.dev) {
            window.chat = this;
        }
    }

    Chat.prototype = $('#chat');

    const chat = new Chat();


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