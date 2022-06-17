export default function (chat) {
    const EL = chat.elements.list;

    let Menu = function (e = null) {
        let menu = this;

        menu.empty()
            .extend(
                {
                    liPattern: '<li class="d-flex align-items-center py-2 px-4">',
                    actionList: {
                        reply: {
                            label: 'Ответить',
                            fu: chat.Message.addReply,
                        },
                        mention: {
                            label: 'Ответить',
                            fu: chat.Message.addMention,
                        }
                    },
                }
            );


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
         * @param action {function}
         * @returns {*}
         */
        menu.users = function (ids, action = null) {
            let list = [];
            for (const id of ids) {
                list.push($(menu.liPattern)
                    .addClass('chat-user-in-list')
                    .append('<div class="chat-svg d-inline-block chat-user-default-1 mr-2">', chat.users[id].displayName) // TODO аватарка
                    .data('id', id)[0]);
            }
            if (action) action(menu, list);
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

    Menu.prototype = EL.menu;


    return {
        Menu: function (e = null) {
            return new Menu(e);
        },
        /**
         * Отобразит меню указанного типа
         * @param e
         * @param type {'actions'|'users'}
         * @param data {int[]|string[]}
         * @param action {function|null}
         */
        showMenu: function (e, type, data, action = null) {
            e.preventDefault();
            (new Menu(e))[type](data, action)
                .cursorPos()
                .show('fadeIn')
                .mouseleave(() => {
                    EL.menu.hide('slideDown');
                });
        },
    };
}