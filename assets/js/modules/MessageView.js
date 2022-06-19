export default function (chat) {
    let MessageView = function () {
        this.types = ['user', 'system', 'date'];
        this.currentDate = (new Date()).toDateString();

        this.user = function (data) {
            let id = data.id,
                body = data.body,
                time = data.timestamp.time,
                userId = data.user_id,
                repliedTo = data.replied_to ?? null,
                mention = data.mention ?? null,
                file = data.file ?? null;

            let div = $('<div class="chat-message d-flex">')
                .data({
                    id: id,
                    userId: userId,
                    fileId: file.id
                })
                .attr('id', 'chat-message-' + id);

            let leftColumn = $('<div>', {class: 'message-left-col'});

            let centerColumn = $('<div class="message-center-col d-flex flex-column flex-fill mx-2">');
            let messageHead = $('<div class="d-flex flex-wrap message-head">');

            let rightColumn = $('<div class="message-right-col d-flex flex-column align-items-center justify-content-end">');

            // Это сообщение мое или чьё-то
            let target, deflt = '1'; // TODO deflt - времянка
            if (userId === parseInt(chat.session.userId)) {
                target = rightColumn
                    .removeClass('justify-content-end')
                    .addClass('justify-content-between');
                deflt = 2
                div.addClass('my-message');
            } else {
                target = leftColumn;
                messageHead.text(chat.users[userId].displayName + ' ');
            }
            if (chat.users[userId].avatar_url) {
                target.append(`<img alt="user" src="${chat.users[userId].avatar_url}">`);
            } else {
                target.append(`<div class="chat-svg chat-user-default-${deflt}">`);
            }

            // Является ли сообщение ответом кому-то
            if (mention.length) {
                let mentionDiv;
                if (mention.length === 1) {
                    mentionDiv = $(`<span class="message-mention">${chat.users[mention[0]].displayName}</span>`);
                } else {
                    mentionDiv = $(`<span class="message-mention">пользователям</span>`)
                        .click((e) => chat.showMenu(e, 'users', mention))
                }

                messageHead.append($(`<div class="text-end small">ответил(а) </div>`).append(mentionDiv));
            }

            // Является ли ответом на сообщение
            if (repliedTo) {
                messageHead
                    .append($('<span class="small">на </span>')
                        .append(
                            $('<a class="message-link">сообщение</a>').attr('href', '#chat-message-' + repliedTo) // TODO учесть, что сообщение может быть не подгружено
                        )
                    );
            }

            centerColumn.append(messageHead)

            // Прикрепленные файлы
            if (file.id !== null) {
                //for (let file of files) {
                centerColumn.append(`<div class="message-attached-file">file_${file.id}${" | " + file.name ?? ""}</div>`);
                // }
            }
            // Текст сообщения
            centerColumn
                .append($('<div class="message-body formatted-message-text mt-1">')
                    .append($('<div>')
                        .append(chat.splitToDivs(body))
                    )
                );

            // Время отправки
            rightColumn.append(`<div class="message-timestamp">${time}</div>`);


            div.append(leftColumn, centerColumn, rightColumn)
                .contextmenu((e) => chat.showMenu(e, 'actions', ['reply']));

            return div[0];
        }

        /**
         * Системное сообщение
         * @param data {{
         *     body: string
         * } | string}
         * @returns {HTMLDivElement}
         */
        this.system = function (data) {
            let body = data.body ?? data;

            let div = $('<div class="system-message chat-message text-muted text-center">')
                .append(`<div class="formatted-message-text">${body}</div>`)

            return div[0];
        }

        /**
         * @param data
         * @returns {HTMLDivElement}
         */
        this.date = function (data) {
            return $(this.system(data)).addClass('chat-messages-date small')[0];
        }
    }

    return {
        /**
         *
         * @param data {{
         *     id: int,
         *     body: string,
         *     timestamp: {
         *         date: string,
         *         time: string
         *     },
         *     user_id: int,
         *     replied_to: int | null,
         *     mention: array | null,
         *     file: [{
         *          id: string,
         *          name: string|null,
         *      }] | null
         * }}
         * @param type {'user'|'system'|'date'}
         */
        messageOne: function (data, type = 'user') {
            let message = new MessageView();
            if (message.types.includes(type)) {
                return message[type](data);
            }
        },
        messageCollection: function (messages) {
            let date = messages[0].timestamp.date,
                list = [];
            for (const message of messages) {
                if (date !== message.timestamp.date && (new Date(date)).toDateString() !== MessageView.currentDate) {
                    date = message.timestamp.date;
                    list.push(chat.messageOne(date, 'date'));
                }
                if (message.user_id === 1) {
                    list.push(chat.messageOne(message, 'system'));
                } else {
                    list.push(chat.messageOne(message));
                }
            }
            return list;
        }
    };
}