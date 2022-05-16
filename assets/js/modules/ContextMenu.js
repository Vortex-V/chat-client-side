export default function (chat) {
    const EL = chat.elements.list;

    let ContextMenu = function () {
        this.user = function (e) {
            return this.setPosition(e, EL.usersContextMenu)
        }
        this.message = function (e) {
            return this.setPosition(e, EL.messageContextMenu)
        };
        this.setPosition = function (e, menu) {
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
            return menu
                .css({
                    left: edges.left,
                    top: edges.top,
                })
        }
    }

    return {
        /**
         * Отобразит контекстное меню указанного типа
         * @param e
         * @param type {'message'|'user'}
         */
        contextMenu: function (e, type) {
            (new ContextMenu)[type](e)
                .data('id', $(e.currentTarget).data('id'))
                .show('fadeIn');
        }
    };
}