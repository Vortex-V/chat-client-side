export default function (chat) {
    const EL = chat.elements.list;

    // Объект сообщения для отправки. Содержимое принимаемых сообщений см. в MessageView.js
    let Message = function () {
        let message = this;
        $.extend(message, {
            user_id: chat.session.userId,
            /**
             * @type {string}
             */
            body: null,
            /**
             * @type {int}
             */
            reply: null,
            /**
             * @type {array}
             */
            mention: [],
            /**
             * @type {object}
             */
            file: null
        });
    }

    Message.obj = null;

    Message.addReply = function (id) {
        chat.Message.obj.replied_to = id;
        EL.messageAdditional.reply.empty().hide()
            .prepend(
                'В ответ на ',
                $('<a class="message-link">сообщение</a>').attr('href', '#chat-message-' + id),
                '<div class="chat-delete-reply chat-svg chat-x-svg float-right"></div>'
            )
            .slideDown(200);
    }

    Message.deleteReply = function () {
        chat.Message.obj.replied_to = null;
        EL.messageAdditional.reply.empty().hide();
    }

    Message.addMention = function (id) {
        let mentionBlock = EL.messageAdditional.mention;
        let mention = chat.Message.obj.mention;
        if (!mention.length) {
            mentionBlock
                .append(
                    'пользователю ',
                    `<span class="message-mention">${chat.users[id].displayName}</span>`,
                    '<div class="chat-delete-mention chat-svg chat-x-svg float-right"></div>'
                );
        } else if (!mention.includes(id)) {
            mentionBlock.empty().hide()
                .append(
                    'в ответ ',
                    '<span class="message-mention chat-mention">пользователям</span>',
                    '<div class="chat-delete-mention chat-svg chat-x-svg float-right"></div>'
                );
        } else {
            return;
        }
        mention.push(id);
        mentionBlock.slideDown(200);
    }

    Message.deleteMention = function (id = null) {
        let mentionBlock = EL.messageAdditional.mention,
            mention = chat.Message.obj.mention;
        if (id === null) {
            chat.Message.obj.mention = [];
            mentionBlock.empty().hide();
            return;
        }
        mention.splice(mention.indexOf(id), 1);
        if (mention.length > 1) {
            mentionBlock.empty().hide()
                .append(
                    'в ответ ',
                    '<span class="message-mention chat-mention">пользователям</span>',
                    '<div class="chat-delete-mention chat-svg chat-x-svg float-right"></div>'
                );
        } else if (mention.length) {
            mentionBlock.empty().hide()
                .append(
                    'пользователю ',
                    `<span class="message-mention">${chat.users[mention[0]].displayName}</span>`,
                    '<div class="chat-delete-mention chat-svg chat-x-svg float-right"></div>'
                );
        } else {
            mentionBlock.empty().hide();
        }
        mentionBlock.slideDown(200);
    }

    Message.attachFile = function (file) {
        EL.messageAdditional.file.empty().hide()
            .append(
                'Прикреплённый файл ' + file.name,
                '<div class="chat-delete-file chat-svg chat-x-svg float-right"></div>'
            )
            .slideDown(200);
        chat.Message.obj.file = file;
    }

    Message.deleteFile = function () {
        EL.messageAdditional.file.empty().hide();
        chat.Message.obj.file = null;
    }

    Message.afterSend = function () {
        Message.obj = new Message();
        EL.messageTextArea.val('');
        EL.messageTextArea.height(EL.textAreaHeight.children()
            .empty()
            .height());
        EL.messageAdditional.children()
            .empty()
            .hide();
    }

    return {
        Message: Message,
        initMessageForSend: function () {
            chat.Message.obj = new Message();
            chat.on('click', '.chat-delete-reply', () => chat.Message.deleteReply())
                .on('click', '.chat-mention',
                    e => chat.showMenu(e, 'users', chat.Message.obj.mention,
                        (menu, list) => {
                            $(list).addClass('chat-delete-mention');
                            list.unshift($(menu.liPattern)
                                .text('Нажмите, чтобы удалить')
                                .click(() => {
                                    chat.Message.deleteMention();
                                    EL.menu.slideUp();
                                })
                            )
                        })
                )
                .on('click', '.chat-delete-mention', e => chat.Message.deleteMention($(e.currentTarget).data('id')))
                .on('click', '.chat-delete-file', () => chat.Message.deleteFile())
                .on('click', '.message-attached-file', () => {/*TODO скачать */});
        }
    };
}