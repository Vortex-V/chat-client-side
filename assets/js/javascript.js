$(() => {
    const API = 'http://chat.api.click2mice.local',
        POST = 'post'
    const session = {
        userId: null,
        roomId: null,
        displayName: null,
    }

    function chatAjax(query, data = null, method = 'get') {
        let options = {
            method: method,
            contentType: 'application/json',
        };
        if (data) options.data = JSON.stringify(data)
        return $.ajax(API + query, options)
            .fail((jqXHR) => {
                console.log(jqXHR.responseJSON.errors)
            });
    }

    let Chat = function () {

        // FUNCTIONS

        /**
         * Осуществляет поиск и сохранение JQuery объектов элементов окна
         * @param elements {{
         *              name:'DOM object id',
         *          }}
         *
         * @returns {{}} Список полученных элементов
         */
        this.elements = function (elements = null) {
            if (elements) {
                this.elements.list = {};
                for (let name in elements) {
                    let id = elements[name];
                    let child = $('#' + id);
                    child.length ? this.elements.list[name] = child : this.throwException(`Не найден элемент по id = ${id}`);
                }
            }
            return this.elements.list
        };

        this.throwException = function (message) {
            throw message;
        };

        this.toggleOpen = function (check = true) {
            EL.chatWindow.toggleClass('closed');
            if (check) {
                this.checkIsClosed();
            }
        }

        /**
         * TODO подумать над тем, оставлять ли эту функцию или объединить с toggleOpen()
         */
        this.checkIsClosed = function () {
            let chatWindow = EL.chatWindow;
            if (chatWindow.hasClass('closed')) {
                chatWindow.draggable('disable');
            } else {
                chatWindow.draggable('enable');
                EL.messageTextArea.focus();
            }
        }

        this.setDraggable = function () {
            EL.chatWindow
                .draggable({
                    handle: EL.topPanel,
                    stack: this.chatWindow,
                    disabled: true,
                    start: function (event, ui) {
                        allowClickOnTopPanel = false;
                    },
                    stop: function () {
                        setTimeout(() => { // Не даёт произойти автоматическому закрытию окна сразу после перетаскивания
                            allowClickOnTopPanel = true;
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
                        this.splitToDivs(EL.messageTextArea.val()
                        )
                    )
                );
            EL.messageTextArea.height(EL.textAreaHeight.height());
        }

        /**
         * @param data {{
         *     id,
         *     body,
         *     timestamp,
         *     user,
         *     mention,
         *     files,
         * }}
         */
        this.addMessage = function (data) {
            EL.messagesList.children().prepend(this.messageDiv(data.id, data.body, data.timestamp, data.user, data.mention, data.files));
        }

        /**
         *
         * @param id {int}
         * @param body {string}
         * @param timestamp {string}
         * @param user {{
         *         id: int,
         *         displayName: string
         *     }}
         * @param mention {array}
         * @param files {[{
         *     id: string,
         *     name: string|null,
         * }]}
         * TODO окончательно опеределиться с параметрами
         */
        this.messageDiv = function (id, body, timestamp, user, mention = [], files = []) {
            let div = $('<div class="chat-message d-flex">').data('id', id);

            if (user.id === 1) { // Значит это системное сообщение
                div.addClass('system-message text-center').text(body);
            } else {
                let leftColumn = $('<div>', {class: 'message-left-col'});

                let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-1">');
                let messageHead = $('<div class="d-flex flex-wrap message-head">');

                let rightColumn = $('<div class="message-right-col position-relative">');

                if (user.id === session.userId) {
                    rightColumn.append('<div class="my-message d-flex justify-content-center align-items-center">Я</div>');
                } else {
                    leftColumn.append('<img alt="user" src="/assets/files/users_default_avatars/User%20avatar.svg">'); //TODO получать src у пользователя или отказаться
                    messageHead.text(user.displayName);
                }

                if (mention.length) {
                    let mentionDiv = $('<span class="message-mention">')
                    if (mention.length === 1) {
                        mentionDiv.text(mention[0]);
                    } else {
                        div.data('mention', mention);
                        mentionDiv.text('пользователям');
                    }

                    messageHead
                        .append($('<div class="text-end w-100">ответил(а) </div>')
                            .append(mentionDiv)
                        );
                }

                centerColumn.append(messageHead)

                for (let file of files) {
                    centerColumn.append(`<div class="message-attached-file">file_${file.id}${" | " + file.name ?? ""}</div>`);
                }

                centerColumn
                    .append($('<div class="message-body formatted-message-text mt-1">')
                        .append($('<div>')
                            .append(this.splitToDivs(body))
                        )
                    );

                rightColumn.append(`<div class="message-timestamp position-absolute bottom-0">${timestamp}</div>`);


                div.append(leftColumn, centerColumn, rightColumn);
            }
            return div;
        }

        this.getTime = function () {
            d = new Date();
            h = d.getHours();
            h / 10 < 1 ? h = '0' + h : h;
            m = d.getMinutes();
            m / 10 < 1 ? m = '0' + m : m;
            return h + ':' + m;
        }

        // REQUESTS
        this.getRoom = function () {
            let result = chatAjax(`/room/get?room_id=${session.roomId}`);
            console.log(this.response);
        }

        this.getRoomMessages = function () {
            chatAjax(`/getRoomMessages?room_id=${session.roomId}`)
                .done((response) => {
                    for (let message of response) {
                        this.addMessage({
                            id: message.id,
                            body: message.body,
                            timestamp: this.getTime(),
                            user: {
                                id: message.user.id,
                                displayName: message.user.display_name
                            },
                        });
                    }
                });
        }

        this.createUser = function () {
            let result = chatAjax(`/user/create`, {
                display_name: 'TEST USER'
            }, POST);
            console.log(this.response);
        }

        this.createRoom = function () {
            let result = chatAjax(`/room/create`, null, POST);
            console.log(this.response);
        }

        this.addUserToRoom = function () {
            let result = chatAjax(`/room/create`, {
                room_id: 1,
                user_id: 2
            }, POST);
            console.log(this.response);
        }

        this.syncRoomUsers = function () {
            let result = chatAjax(`/room/create`, {
                room_id: 1,
            }, POST);
            console.log(this.response);
        }

        this.sendMessage = async function () {
            let messageBody = EL.messageTextArea.val();
            if (messageBody) {
                chatAjax('/sendMessage', {
                    user_id: session.userId,
                    room_id: session.roomId,
                    body: messageBody
                }, POST)
                    .done((response) => {
                        this.addMessage({
                            id: response.id,
                            body: response.body,
                            timestamp: this.getTime(), //TODO заменить на данные из API
                            user: {
                                id: session.userId,
                                displayName: session.displayName
                            },
                        });
                        EL.messageTextArea.height(25);
                        EL.messageTextArea.val('');
                    })
                    .fail(() => {
                        console.log('test')
                    });
            }
        }
        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS

        const EL = this.elements({
            chatWindow: 'chat',
            topPanel: 'chat-top-panel',
            messageTextArea: 'chat-message-textarea',
            textAreaHeight: 'chat-textarea-height',
            messagesList: 'chat-messages-list',
            buttonSendMessage: 'chat-send-message',
        });


        const allowedOnLoadFunctions = [
            'toggleOpen',
            'setDraggable',
        ];

        /* Открывает окно чата при нажатии Ctrl+Shift+ArrowUp
        TODO: сделать комбинацию клавиш настриваемой */
        $(window).keydown((e) => {
            let keyEvent = e.originalEvent;
            if (keyEvent.keyCode === 38 && keyEvent.shiftKey && keyEvent.ctrlKey) {
                this.toggleOpen();
            }
        });

        let allowClickOnTopPanel = EL.topPanel.click.allow = true;
        EL.topPanel.click(() => {
            if (allowClickOnTopPanel) {
                this.toggleOpen();
            }
        });

        EL.messageTextArea
            .on('input', () => this.updateFieldHeight())
            .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendMessage();
                }
            });

        EL.buttonSendMessage.click(this.sendMessage);

        let config = JSON.parse(EL.chatWindow.attr('data-config')) ?? {};
        EL.chatWindow.removeAttr('data-config');
        if (config.css) {
            EL.chatWindow.css(config.css);
        }

        if (config.chatLoad) {
            for (let name in config.chatLoad) {
                if (allowedOnLoadFunctions.includes(name)) {
                    this[name](config.chatLoad[name]);
                }
            }

        }
    }

    const chat = window.chat = new Chat();

    let chatWindow = chat.elements.list.chatWindow;

    let sessionData = JSON.parse(chatWindow.attr('data-session')) ?? null;
    if (sessionData) {
        session.userId = sessionData.userId;
        session.roomId = sessionData.roomId;
        session.displayName = sessionData.displayName;
    }
    chatWindow.removeAttr('data-session');

    /* Чтобы не стёртый ранее текст из поля ввода сообщения
       влиял на высоту блока ввода после обновления страницы */
    chat.updateFieldHeight();
    chat.getRoomMessages();
});