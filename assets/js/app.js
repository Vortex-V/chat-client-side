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
                this.trigger('chatOpen');
            } else {
                this.addClass('closed');
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
            this.css('position', 'fixed')
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
            /* Открывает окно чата при нажатии Ctrl+Shift+ArrowUp
            TODO: сделать комбинацию клавиш настриваемой */
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
                this.messageView(message);
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
                if (user_id === parseInt(this.userId)) {
                    rightColumn
                        .removeClass('justify-content-end')
                        .addClass('justify-content-between')
                        .append('<div class="my-message d-flex justify-content-center align-items-center">Я</div>');
                } else {
                    if (this.users[user_id].avatar_url){
                        leftColumn.append(`<img alt="user" src="${this.users[user_id].avatar_url}">`);
                    } else {
                        leftColumn.append('<div class="chat-svg chat-user-default">');
                    }
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
                        .append($('<div class="text-end">&nbsp;на </div>')
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
                div.contextmenu((e) => this.showContextMenu(e));
            }

            EL.messagesList.prepend(div);
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
                .data($(e.currentTarget).data())
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
                        sessionStorage.chatUsers = JSON.stringify(users);
                        this.users = users;
                        this.trigger('chatLoadMessages');
                    } else {
                        this.throwException('Ошибка на стороне сервера');
                    }
                });
        }

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
                        sessionStorage.chatMessages = JSON.stringify(messages);
                        this.showMessages(messages);
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
                        sessionStorage.removeItem('chatMessages');
                    });
            }
        }

        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS & CONSTANTS

        const EL = this.elements({
            topPanel: 'top-panel',
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

        this
            .on('chatLoadFromSessionStorage', () => {
                if (sessionStorage.pathname !== location.pathname) { // TODO Вероятно (и возможно что довольно таки) глупое решение. Подумать.
                    this.trigger('chatNeedsUpdate');
                }
                if (sessionStorage.chatUsers) {
                    this.users = JSON.parse(sessionStorage.chatUsers);
                    this.trigger('chatLoadMessages');
                } else {
                    this.getRoomUsers(); // устанавливает sessionStorage.users и this.users
                }
            })
            .on('chatNeedsUpdate', () => {
                sessionStorage.pathname = location.pathname;
                sessionStorage.removeItem('chatUsers');
                sessionStorage.removeItem('chatMessages');
            })
            .on('chatLoadMessages', () => {
                if (sessionStorage.chatMessages) {
                    if (this.users) {
                        this.showMessages(JSON.parse(sessionStorage.chatMessages));
                    } else {
                        this.throwException('Chat: отсутствуют пользователи');
                    }
                } else {
                    this.getRoomMessages(); // устанавливает sessionStorage.messages
                }
            })
            .on('chatOpen', () => {
                    EL.messagesList
                        .show()
                        .addClass('d-flex');
                    EL.messageTextArea[0].disabled = false;
                    EL.messageTextArea.focus();
                },
            )
            .on('chatClose', () => {
                EL.messagesList
                    .removeClass('d-flex')
                    .hide();
                EL.messageTextArea.blur();
                EL.messageTextArea[0].disabled = true;
            });

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

            if (config.css) this.css(config.css);

            if (config.draggable) {
                this.setDraggable();
            } else if (config.foldable) {
                this.setFoldable();
            }

            if (config.dev) {
                window.chat = this;
            }
        }

        if (sessionData) {
            this.userId = sessionData.userId;
            this.roomId = sessionData.roomId;
            this.trigger('chatLoadFromSessionStorage');
        } else {
            this.throwException('Отсутствуют данные о сессии');
        }

        this.showFlexEl()
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