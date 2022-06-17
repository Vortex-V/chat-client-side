export default function (chat) {
    let EL = chat.elements.list;

    let UserSearch = function () {
        let search = this,
            params = {
                pattern: '',
                patternPosition: null,
                lastInput: null,
                lastAdded: {},
                lastDeleted: {},
                previousValue: search.val(),
                previousInput: '',
            }

        search.extend(params);

        search.getLastAddedPosition = function () {
            return Object.keys(search.lastAdded)[0];
        }

        search.getLastDeletedPosition = function () {
            return Object.keys(search.lastDeleted)[0];
        }

        /**
         * @param val1 {string}
         * @param val2 {string}
         * @returns {Object}
         */
        search.valueDiff = function (val1, val2) {
            val1 = Array.from(val1)
            val2 = Array.from(val2);
            return Object.fromEntries(
                Object.entries(val1)
                    .filter(([key, val]) => {
                        return val2[key] !== val; // TODO если lastInput равен тому символу, что в той же позиции стоял, то он его не заметит (надо решить: баг или фича)
                    })
            );
        }

        search.updateParams = function (e) {
            search.lastInput = e.originalEvent.data;
            if (search.lastInput !== null) {
                search.lastAdded = search.valueDiff(search.val(), search.previousValue);
                search.lastDeleted = {};
            } else {
                search.lastDeleted = search.valueDiff(search.previousValue, search.val());
                search.lastAdded = {};
            }
            search.previousValue = search.val();
        }

        search.find = function (e) {
            search.updateParams(e)
            EL.contextMenu.empty().hide();
            if (search.lastInput === null && Object.values(search.lastDeleted).includes('@')) {
                search.end();
                return;
            }

            let lastPosition = search.getLastAddedPosition(),
                action = 1;
            if (lastPosition === undefined) {
                lastPosition = search.getLastDeletedPosition();
                action = -1;
            }
            let patternEnd = search.patternPosition + search.pattern.length;
            if (lastPosition >= search.patternPosition && lastPosition <= patternEnd) {
                search.pattern = search.val().slice(search.patternPosition, patternEnd + action);
                if (search.pattern.length >= 2) {
                    search.findByPattern();
                }
            } else if (lastPosition <= search.patternPosition) {
                search.patternPosition += action;
            }
        }

        search.findByPattern = function () {
            let result = [];
            for (const [id, user] of Object.entries(chat.users)) {
                if (user.displayName.toLowerCase().search(search.pattern.toLowerCase()) !== -1) {
                    result.push(id);
                }
            }
            search.trigger('chat.userSearch.result', [result]);
        }

        search.checkStart = function (e) {
            search.updateParams(e);
            if (search.lastInput === '@') {
                let inputPosition = search.getLastAddedPosition();
                let str = search.val().slice(inputPosition - 1, inputPosition)
                if (str === '' || str === ' ') {
                    search.patternPosition = parseInt(inputPosition) + 1;
                    search.on('input', search.find)
                        .off('input', search.checkStart);
                }
            }
            search.previousInput = search.lastInput;
        }

        search.end = function () {
            search.on('input', search.checkStart)
                .off('input', search.find)
                .extend(params);
            search.trigger('chat.userSearch.end');
        }

        search.finishPattern = function (text) {
            let val = search.val();
            val = Array.from(val);
            val.splice(search.patternPosition - 1, search.patternPosition + search.pattern.length + 1, text);
            console.log(val);
            search.val(val.join(''));
        }

        search.on('input', search.checkStart)
    }

    UserSearch.prototype = EL.messageTextArea;

    UserSearch.obj = null;

    return {
        initUserSearch: function () {
            UserSearch.obj = (new UserSearch)
                .on('chat.userSearch.result', (e, result) => {
                    if (result.length) {
                        let messageTextArea = EL.messageTextArea;
                        let parent = messageTextArea.parents('.chat-message-input-region');
                        chat.Menu()
                            .users(result)
                            .addClass('search-result')
                            .css({
                                left: messageTextArea.offset().left,
                                top: parent.offset().top + parent[0].clientHeight
                            })
                            .slideDown(200);
                    }
                })

            chat.on('click', '.search-result .chat-user-in-list', (e) => {
                let el = $(e.currentTarget);
                chat.Message.addMention(el.data('id'));
                UserSearch.obj.finishPattern(el.text());
                UserSearch.obj.end();
                EL.contextMenu.slideUp();
            })
        },
    };
}