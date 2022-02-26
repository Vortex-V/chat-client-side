$(() => {
    const API = 'http://chat.api.click2mice.local';

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
        this.createMessage = function (msgBody) {
            EL.messagesList.scrollable.prepend($(
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

        /**
         * @returns {*}
         */
        this.sendMessage = function () {
            let requestBody = EL.messageArea.val();
            let result = this.sendAjax('/message/send',
                {
                    userId: this.session.userId,
                    roomId: this.session.roomId,
                    body: requestBody,
                }, 'post');
            this.createMessage(requestBody);
            return result;
        }

        this.sendAjax = function (query, data, method = 'get') {
            let result = "TEST FAILED";
            $.ajax(
                API + query,
                {
                    method: method,
                    crossDomain: true,
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    success: (resultData) => {
                        result = resultData;
                    },
                    error: (jqXHR, exception) => {
                        result = exception;
                    },
                }
            );

            $(document).ajaxSuccess(function () {
                console.log("Triggered ajaxSuccess handler.");
            });
            console.log(result)
            return result;
        }

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
    console.log(chat);

    // Dev tool
    chat.startTest = function (userId = 1, roomId = 1) {
        chat.session = {
            'userId': userId,
            'roomId': roomId,
        }
    };

    function XHRGetTest() {
        let xhr = new XMLHttpRequest();

        xhr.open("GET", 'http://chat.api.click2mice.local/message/send' + '?test=TEST', true);
        xhr.onreadystatechange = function (p) {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    console.log(xhr.responseText);
                }
            }
        };

        xhr.send();
    }

    function XHRPostTest(query) {
        let xhr = new XMLHttpRequest();

        xhr.open("POST", 'http://chat.api.click2mice.local' + query, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.onreadystatechange = function (p) {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                let status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    console.log(xhr.responseText);
                }
            }
        };

        xhr.send(JSON.stringify({
            data: 'test'
        }));
    }
});
