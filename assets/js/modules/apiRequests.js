export default function (chat) {
    const EL = chat.elements.list;

    const contentJSON = 'application/json';
    let baseOptions = {
        contentType: contentJSON,
        //dataType: contentJSON, //Странно, что с ним кидает на fail(), хоть ответ 200
        crossDomain: true,
    };

    /**
     * @param query {string}
     * @param data {Object}
     * @param method {'GET'|'POST'}
     * @param options {Object}
     * @returns {*}
     */
    let ajax = function (query, data, method = 'GET', options = {}) {
        if (method === 'GET') { // простой get запрос
            options.data = data;
        } else if (options.contentType === false) { // возможна отправка файла, post запрос
            let formData = new FormData();
            for (const [name, value] of Object.entries(data)) {
                formData.set(name, value);
            }
            options.data = formData;
        } else { // post запрос
            options.data = JSON.stringify(data);
        }
        if (chat.httpHeaders) options.headers = chat.httpHeaders;
        return $.ajax(chat.apiUrl + query,
            $.extend(baseOptions, options, {
                method: method,
            }))
            .fail((jqXHR) => {
                console.log(jqXHR.responseJSON)
            });
    }

    return {
        getRoom: function () {
            return ajax(`/room/${chat.session.roomId}`, {
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
            return ajax(`/room/${chat.session.roomId}/messages`, {
                params: params,
            }, 'GET', {
                processData: true,
            }).done((messages) => {
                if (typeof messages !== 'object') {
                    throw new Error('Ошибка на стороне сервера');
                }
                if (messages.length) {
                    chat[paramName] = messages[paramName === 'lastMessage' ? 0 : messages.length - 1].id;
                    chat.showMessages(messages, insertMethod);
                }
            })
        },
        sendMessage: function () {
            let body = EL.messageTextArea.val();
            if (body || chat.Message.obj.files) {
                ajax(`/room/${chat.session.roomId}/message`,
                    Object.assign(chat.Message.obj, {
                        body: body
                    }), "POST", {
                        contentType: false,
                        processData: false,
                    })
                    .done((message) => {
                        chat.lastMessage = message.id;
                        chat.showMessage(message, "prepend");
                        chat.Message.afterSend();
                    });
            }
        },
    };
}