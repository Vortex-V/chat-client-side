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
            .fail((jqXHR) => {
                console.log(jqXHR.responseJSON)
            });
    }

    return {
        getRoom: function () {
            return ajax('/room', {
                params: {
                    limit: chat.loadMessagesLimit,
                }
            }).done(
                /**
                 * @param room {{
                 *     users: {
                 *          id: {
                 *              id: int,
                 *              displayName: string
                 *          }
                 *     },
                 *     messages: array
                 * }}
                 */
                (room) => {
                    if (typeof room === 'object') {
                        if (room.users && Object.keys(room.users).length) {
                            chat.users = room.users;
                        } else {
                            chat.showMessage('В комнату не добавлено ни одного пользователя', "prepend", "system");
                        }
                        if (room.messages.length) {
                            chat.lastMessage = room.messages[0].id;
                            chat.oldestMessage = room.messages[room.messages.length - 1].id;
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
                params.last_id = chat.lastMessage;
                paramName = 'lastMessage';
            } else if (insertMethod === 'append') {
                params.oldest_id = chat.oldestMessage;
                paramName = 'oldestMessage';
            }
            return ajax('/roomMessages', {
                params: params,
            }).done((messages) => {
                if (typeof messages === 'object' && messages.length) {
                    chat[paramName] = messages[paramName === 'lastMessage' ? 0 : messages.length - 1].id;
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
                    Object.assign(chat.Message.obj, {
                        body: body
                    }), "POST")
                    .done((message) => {
                        chat.lastMessage = message.id;
                        chat.showMessage(message, "prepend");
                        chat.Message.afterSend();
                    });
            }
        },
    };
}