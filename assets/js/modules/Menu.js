export default function (chat) {
    const EL = chat.elements.list;

    let Menu = function (e = null) {
        let menu = this;

        menu.empty();
        menu.liPattern = '<li class="d-flex align-items-center py-2 px-4">';
        menu.actionList = {
            reply: {
                label: 'Ответить',
                fu: function (id) {
                    chat.message.replied_to = id;
                    EL.messageAdditional.reply
                        .empty()
                        .hide()
                        .text('В ответ на ')
                        .append(
                            $('<a class="message-link">сообщение</a>').attr('href', '#chat-message-' + id)
                        )
                        .slideDown(200);
                },
            },
            mention: {
                label: 'Ответить',
                fu: function (id) {
                    let mentionBlock = EL.messageAdditional.mention;
                    if (!chat.message.mention) {
                        chat.message.mention = [];
                        mentionBlock
                            .text('пользователю ')
                            .append(
                                $(`<span class="message-mention">${chat.users[id].displayName}</span>`)
                            );
                    } else if (!chat.message.mention.includes(id)) {
                        mentionBlock
                            .empty()
                            .hide()
                            .append(
                                'в ответ',
                                $('<span class="message-mention"> пользователям</span>')
                                    .click((e) => chat.showContextMenu(e, 'users', chat.message.mention))
                            );
                    } else {
                        return;
                    }
                    chat.message.mention.push(id);
                    mentionBlock.slideDown(200);
                }
            }
        };

        /**
         * @param actions {string[]}
         * @returns {*}
         */
        menu.actions = function (actions) {
            let id = $(e.currentTarget).data('id');
            let list = [];
            for (const action of actions) {
                list.push($(menu.liPattern)
                    .text(menu.actionList[action].label)
                    .click(() => {
                        menu.actionList[action].fu(id)
                    }));
            }
            return menu.append(list);
        };

        /**
         * @param ids {int[]}
         * @param action {boolean}
         * @returns {*}
         */
        menu.users = function (ids, action = false) {
            let list = [];
            for (const id of ids) {
                let item = $(menu.liPattern)
                    .append('<div class="chat-svg d-inline-block chat-user-default-1 mr-2">', chat.users[id].displayName) // TODO аватарка
                    .data('id', id);
                if (action) item.click(() => menu.actionList.mention.fu(id));

                list.push(item);
            }

            return menu.append(list);
        }

        menu.cursorPos = function () {
            let chatEdges = chat.offset();
            $.extend(chatEdges, {
                right: chatEdges.left + chat.width(),
                bottom: chatEdges.top + chat.height()
            });
            let edges = {
                left: e.originalEvent.pageX,
                top: e.originalEvent.pageY,
            };
            $.extend(edges, {
                right: edges.left + menu.width(),
                bottom: edges.top + menu.height(),
            })

            // Чтобы не выходил за края
            if (edges.left < chatEdges.left) edges.left += chatEdges.left - edges.left;
            if (edges.right > chatEdges.right) edges.left -= edges.right - chatEdges.right;
            if (edges.bottom > chatEdges.bottom) edges.top -= edges.bottom - chatEdges.bottom;
            menu.css({
                left: edges.left - 1,
                top: edges.top - 1,
            });
            return menu;
        }
    }

    Menu.prototype = EL.contextMenu;


    return {
        Menu: Menu,
        /**
         * Отобразит контекстное меню указанного типа
         * @param e
         * @param type {'actions'|'users'}
         * @param data {int[]|string[]}
         */
        showContextMenu: function (e, type, data) {
            e.preventDefault();
            (new Menu(e))[type](data)
                .cursorPos()
                .show('fadeIn')
                .mouseleave(() => {
                    EL.contextMenu.hide('slideDown');
                });
        },
    };
}