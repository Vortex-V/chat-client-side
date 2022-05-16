export default function (chat) {
    const EL = chat.elements.list;

    /**
     * @param query {string}
     * @param data {object|null}
     * @param method {'GET'|'POST'}
     * @returns {*}
     */
    let ajax = function (query, data = null, method = "GET") {
        let options = {
            method: method,
            contentType: 'application/json',
        };
        if (chat.httpHeaders) options.headers = chat.httpHeaders;
        let defaults = {
            room_id: chat.session.roomId,
            user_id: chat.session.userId
        }
        data ?
            $.extend(data, defaults)
            : data = defaults;
        method === "GET" ?
            options.data = data
            : options.data = JSON.stringify(data);
        return $.ajax(chat.apiUrl + query, options)
            .fail((response) => {
                console.log(response);
            });
    }

    return {
        getRoom: function () {
            ajax('/room', {
                params: {
                    limit: chat.loadMessagesLimit,
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
                                chat.last_id = room.messages[0].id;
                                chat.oldest_id = room.messages[room.messages.length - 1].id;
                                chat.showMessages(room.messages);
                            } else {
                                chat.showMessage('Здесь пока нет ни одного сообщения', "prepend", "system");
                            }
                        } else {
                            chat.showMessage('Ошибка загрузки комнаты', "prepend", "system");
                        }
                    })
                .fail(() => chat.showMessage('Ошибка загрузки комнаты', "prepend", "system"));
        },
        /**
         * @param insertMethod {'prepend'|'append'}
         */
        loadMessages: function (insertMethod) {
            /**
             * @type {{
             *      limit: int,
             *      last_id: int|null,
             *      oldest_id: int|null,
             * }}
             */
            let params = {
                limit: chat.loadMessagesLimit,
            };
            /**
             * @type {'last_id'|'oldest_id'}
             */
            let paramName;
            if (insertMethod === "prepend") {
                params.last_id = chat.last_id;
                paramName = 'last_id';
            } else if (insertMethod === 'append') {
                params.oldest_id = chat.oldest_id;
                paramName = 'oldest_id';
            }
            ajax('/roomMessages', {
                params: params,
            }).done((messages) => {
                if (typeof messages === 'object') {
                    chat[paramName] = messages[paramName === 'last_id' ? 0 : messages.length - 1].id;
                    chat.showMessages(messages, insertMethod);
                } else {
                    throw new Error('Ошибка на стороне сервера');
                }
            })
        },
        sendMessage: function () {
            let body = EL.messageTextArea.val();
            if (body) {
                ajax('/sendMessage',
                    Object.assign(chat.message, {
                        body: body
                    }), "POST")
                    .done((message) => {
                        chat.last_id = message.id;
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
        },
    };
}