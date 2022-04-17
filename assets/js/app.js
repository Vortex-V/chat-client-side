$(() => {
    const API = 'http://chat.api.click2mice.local',
        POST = 'post',
        GET = 'get',
        SESSION = {
            userId: null,
            roomId: null,
            displayName: null,
            users: null,
        };

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
        this.viewMessage = function (data) {
            let id = data.id,
                body = data.body,
                timestamp = data.timestamp,
                user_id = data.user_id,
                replied_to = data.replied_to ?? null,
                mention = data.mention ?? null,
                files = data.files ?? null;
            let div = $('<div class="chat-message d-flex">').attr('id', id);

            if (user_id === 1) { // Значит это системное сообщение
                div.addClass('system-message text-center').text(body);
            } else {
                let leftColumn = $('<div>', {class: 'message-left-col'});

                let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-1">');
                let messageHead = $('<div class="d-flex flex-wrap message-head px-1">');

                let rightColumn = $('<div class="message-right-col d-flex flex-column align-items-center justify-content-end">');

                // Это сообщение мое или чьё-то
                if (user_id === SESSION.userId) {
                    rightColumn
                        .removeClass('justify-content-end')
                        .addClass('justify-content-between')
                        .append('<div class="my-message d-flex justify-content-center align-items-center">Я</div>');
                } else {
                    leftColumn.append('<img alt="user" src="/assets/files/users_default_avatars/User%20avatar.svg">'); //TODO получать src у пользователя или подумать ещё раз
                    messageHead.text(USERS[user_id].displayName);
                }

                // Является ли сообщение ответом кому-то
                if (mention) {
                    let mentionDiv = $('<span class="message-mention">');
                    if (mention instanceof 'int') {
                        mentionDiv.text(mention);
                    } else {
                        div.attr('data-mention', mention);
                        mentionDiv.text('пользователям');
                    }

                    messageHead
                        .append($('<div class="text-end">ответил(а) </div>')
                            .append(mentionDiv)
                        );
                }

                // Является ли ответом на сообщение
                if (replied_to) {
                    messageHead
                        .append($('<div class="text-end">на </div>')
                            .append(
                                $('<a class="message-reply">сообщение</a>').attr('href', replied_to)
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
            }

            // Контекстное меню
            div.contextmenu(this.contextMenu);

            EL.messagesList.prepend(div);
        }

        this.contextMenu = function (e) {
            e.preventDefault();
            let x = e.originalEvent.layerX,
                y = e.originalEvent.layerY,
                messagesList = EL.messagesList,
                messageContextMenu = EL.messageContextMenu;
            while (messagesList.width() - x < 250) {
                x -= 30;
            }
            /*while (messagesList.height() - y < messageContextMenu.height()) {
                y -= 10;
            }*/
            messageContextMenu.css({
                left: x,
                top: y,
            }).show('fadeIn');
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
            chatAjax(`/getRoomMessages/${SESSION.roomId}/${SESSION.userId}`,
                {
                    params: {
                        limit: 20,
                        page: 1,
                    }
                })
                .done((response) => {
                    for (let message of response) {
                        this.viewMessage(message);
                    }
                });
        }

        this.sendMessage = async function () {
            let messageBody = EL.messageTextArea.val();
            if (messageBody) {
                chatAjax('/sendMessage', {
                    user_id: SESSION.userId,
                    room_id: SESSION.roomId,
                    body: messageBody
                }, POST)
                    .done((message) => {
                        this.viewMessage(message);
                        EL.messageTextArea.height(25);
                        EL.messageTextArea.val('');
                    });
            }
        }

        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS & CONSTANTS

        const EL = this.elements({
            topPanel: 'chat-top-panel',
            messageTextArea: 'chat-message-textarea',
            textAreaHeight: 'chat-textarea-height',
            messagesList: 'chat-messages-list',
            buttonSendMessage: 'chat-send-message',
            messageContextMenu: 'chat-message-contextmenu',
        });

        const allowedOnLoadFunctions = [
            'toggleOpen',
            'setDraggable',
        ];

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

        EL.messageTextArea
            .on('input', () => this.updateFieldHeight())
            .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendMessage();
                }
            });

        let allowClickOnTopPanel = EL.topPanel.click.allow = true;
        EL.topPanel.click(() => {
            if (allowClickOnTopPanel) {
                this.toggleOpen();
            }
        });

        this.on('chatOpen',
            () => {
                EL.messageTextArea.focus();
                this.draggable('enable');
            },
        )
            .on('chatClose', () => {
                this.draggable('disable');
            })
            .on('load', () => {
                let config = JSON.parse(this.attr('data-config')) ?? null;
                this.removeAttr('data-config');
                if (config) {
                    if (config.css) this.css(config.css);
                    if (config.onLoad) {
                        config.onLoad.forEach((i) => {
                            if (i.function && allowedOnLoadFunctions.includes(i.function)) {
                                this[i.function](i.args ?? null)
                            }
                        })
                    }
                }

                let sessionData = JSON.parse(this.attr('data-session')) ?? null;
                this.removeAttr('data-session');
                if (sessionData) {
                    SESSION.userId = sessionData.userId;
                    SESSION.roomId = sessionData.roomId;
                    SESSION.displayName = sessionData.displayName;
                }

                this.updateFieldHeight(); //Чтобы не стёртый ранее текст из поля ввода сообщения влиял на высоту блока ввода после обновления страницы
                this.getRoomMessages();
            })

        EL.buttonSendMessage.click(this.sendMessage);

        EL.messageContextMenu.mouseleave(function () {
            $(this).hide('slideDown');
        });

    }

    Chat.prototype = $('#chat');

    const chat = window.chat = new Chat();
    chat.trigger('load');

    //DEV

    /**
     * @param fn
     */
    function time(fn) {
        const name = fn.name === '' ? 'function' : fn.name;
        console.time(name);
        let res = fn();
        console.timeEnd(name);
        return res;
    }
});