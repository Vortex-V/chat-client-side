$(() => {
    const API = 'http://chat.api.click2mice.local',
        POST = 'post',
        GET = 'get'
    let session = {
        userId: null,
        roomId: null,
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

        this.toggleOpen = function () {
            EL.chatWindow.toggleClass('closed');
            this.checkIsClosed();
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
                EL.messageArea.focus();
            }
        }

        /**
         * Разбивает текст на блоки по переносам строки
         * @param text
         * @returns {[]}
         */
        this.splitToDivArray = function (text) {
            let paragraphs = text.split('\n');
            let result = [];
            for (let paragraph of text.split('\n')) {
                result.push($('<div>').text(paragraph));
            }
            return result;
        }

        /**
         * @param msgBody {string}
         */
        this.addMessageToField = function (msgBody) {
            EL.messagesList.children('.msgs-scrollable').prepend($(
                `<div class="message my-message f j-e">
                    <div class="msg-left-col"></div>
                    <div class="f col msg-center-col">
                        <div class="f a-e msg-head"></div>
                        <div class="msg-body">${msgBody}</div>
                    </div>
                    <div class="f col j-b msg-right-col">
                        <div class="msg-me f j-c a-c">Я</div>
                        <div class="f a-e msg-timestamp">9:00</div>
                    </div>
                </div>`
            ));
            EL.messageArea.height(25);
            EL.messageArea.val('');
            //this.resetMaxScrollY();
        }

        // REQUESTS
        this.getRoom = function () {
            let result = sendAjax(`/room/get?room_id=${session.roomId}`);
            console.log(this.response);
        }

        this.getMessage = function () {
            let result = sendAjax(`/message/get?message_id=${1}`);
            console.log(this.response);
        }

        this.createUser = function () {
            let result = sendAjax(`/user/create`, {
                display_name: 'TEST USER'
            }, POST);
            console.log(this.response);
        }

        this.createRoom = function () {
            let result = sendAjax(`/room/create`, null, POST);
            console.log(this.response);
        }

        this.addUserToRoom = function () {
            let result = sendAjax(`/room/create`, {
                room_id: 1,
                user_id: 2
            }, POST);
            console.log(this.response);
        }

        this.syncRoomUsers = function () {
            let result = sendAjax(`/room/create`, {
                room_id: 1,
            }, POST);
            console.log(this.response);
        }

        this.sendMessage = function () {
            let messageBody = EL.messageArea.val();
            let result = sendAjax('/message/send', {
                user_id: session.userId,
                room_id: session.roomId,
                body: messageBody
            }, POST);
            if (result.status === 200) {
                this.addMessageToField(messageBody);
            }
        }
        // END REQUESTS

        // END FUNCTIONS


        // ELEMENTS

        const EL = this.elements({
            chatWindow: 'c2m-chat',
            topPanel: 'chat-top-panel',
            messageArea: 'chat-msg-area',
            inputLinesCountChecker: 'chat-input-lines-count-checker',
            messagesList: 'chat-msgs-list',
            buttonSendMessage: 'chat-send-message',
        });

        /* Открывает окно чата при нажатии Ctrl+Alt+T
        TODO: сделать комбинацию клавиш настриваемой */
        $(window).keydown((e) => {
            let keyEvent = e.originalEvent;
            if (keyEvent.keyCode === 84 && keyEvent.altKey && keyEvent.ctrlKey) {
                this.toggleOpen();
            }
        });

        let allowClickOnTopPanel = EL.topPanel.click.allow = true;
        EL.topPanel.click(() => {
            if (allowClickOnTopPanel) {
                this.toggleOpen();
            }
        });

        EL.messageArea
            .on('input', () => {
                // Определяет высоту текстового поля из количества введенных строк
                EL.inputLinesCountChecker.children('div')
                    .replaceWith(
                        $("<div>").append(
                            this.splitToDivArray(
                                EL.messageArea.val())
                        )
                    );
                //EL.messageArea.height(EL.inputLinesCountChecker.height());
            })
            .keydown((e) => {  /* Отправляет сообщение на Ctrl+Enter TODO: сделать комбинацию клавиш настриваемой */
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendMessage();
                }
            });

        EL.buttonSendMessage.click(this.sendMessage);

        /* TODO убрать полностью либо доработать */
        /*EL.messagesList.scrollable = EL.messagesList.children('.msgs-scrollable');
        EL.messagesList.on('wheel', (e) => {
            let newScrollY = parseInt(EL.messagesList.scrollable.css('margin-top')) - e.originalEvent.deltaY * 2;
            let absNewScrollY = Math.abs(newScrollY);
            let maxScrollY = EL.messagesList.maxScrollY;
            if (newScrollY <= 0 && absNewScrollY <= maxScrollY) {
                if (absNewScrollY < 200) newScrollY = 0;
                else if (absNewScrollY > maxScrollY - 200) newScrollY = -maxScrollY;
                EL.messagesList.scrollable.css('margin-top', newScrollY);
            }
        });*/


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
            })
            .addClass('closed')
            .show();
    }

    let chat = window.chat = new Chat();

    function sendAjax(query, data = null, method = GET) {
        let options = {
            method: method,
            contentType: 'application/json',
        };
        if (data) options.data = JSON.stringify(data)
        return $.ajax(API + query, options)
            .done((resultData, status, jqXHR) => {
                chat.response = resultData;
            })
            .fail((jqXHR, text, error) => {
                console.log(jqXHR)
                console.log(text)
                console.log(error)
            })
    }

    // Dev tool
    chat.startTest = function (userId = 1, roomId = 1) {
        session.userId = 1;
        session.roomId = 1;
        return 1;
    };
});
