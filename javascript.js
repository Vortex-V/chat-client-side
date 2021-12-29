$(() => {
  let Chat = function () {
    this.elements({
      'topPanel': 'chat-top-panel',
      'inputMessage': 'chat-input-msg',
      'inputLinesCountChecker': 'chat-input-lines-count-checker',
      'messagesList': 'chat-msgs-list',
      'buttonSendMessage': 'chat-send-message',
    });


    /* Открывает окно чата при нажатии Ctrl+Alt+T 
    TODO: сделать комбинацию клавиш настриваемой */
    $(window).keydown((e) => {
      let keyEvent = e.originalEvent;
      if (keyEvent.keyCode == 84 && keyEvent.altKey && keyEvent.ctrlKey) {
        this.openOrClose();
      }
    });

    /* topPanel */
    let topPanel = this.topPanel;
    topPanel.click.canClick = true;


    let click = () => {
      if (this.topPanel.click.canClick) {
        this.openOrClose();
      }
    }
    topPanel.one('click', () => {
      this.openOrClose();
      setTimeout(() => {
        this.resetMaxScrollY(); // TODO: после реализации функционала подгрузки сообщений с БД перенести
      }, 500);
      topPanel.click(click);
    }, );


    /* inputMessage & inputLinesCountChecker */
    let inputMessage = this.inputMessage;
    let inputLinesCountChecker = this.inputLinesCountChecker;
    inputMessage.on('input', () => {
      // Определяет высоту текстового поля из количества введенных строк
      let paragraphs = this.convertBreakes(inputMessage.val());
      let newInputedParagraps = $("<div>").append(paragraphs);
      let inputedParagraps = inputLinesCountChecker.children('div');
      inputedParagraps.replaceWith(newInputedParagraps);
      inputMessage.height(inputLinesCountChecker.height());
    });
    /* Отправляет сообщение на Ctrl+Enter
    TODO: сделать комбинацию клавиш настриваемой */
    inputMessage.keydown((e) => {
      if (e.key == 'Enter' && e.ctrlKey) {
        this.createMessage();
      };
    });


    /* buttonSendMessage */
    this.buttonSendMessage.click(() => {
      this.createMessage();
    });


    /* messagesList */
    let messagesList = this.messagesList;
    messagesList.scrollable = messagesList.children('.msgs-scrollable');
    // maxScrollY задаётся в событии topPanel.click
    messagesList.on('wheel', (e) => {
      let newScrollY = parseInt(messagesList.scrollable.css('margin-top')) - e.originalEvent.deltaY * 2;
      let absNewScrollY = Math.abs(newScrollY);
      let maxScrollY = messagesList.maxScrollY;
      if (newScrollY <= 0 && absNewScrollY <= maxScrollY) {
        if (absNewScrollY < 200) newScrollY = 0;
        else if (absNewScrollY > maxScrollY - 200) newScrollY = -maxScrollY;
        messagesList.scrollable.css('margin-top', newScrollY);
      }
    });

    this.draggable({
      handle: topPanel,
      stack: this,
      disabled: true,
      start: function (event, ui) {
        topPanel.click.canClick = false;
      },
      stop: function () {
        // Не даёт произойти закрытию окна после перетаскивания
        setTimeout(() => {
          topPanel.click.canClick = true;
        }, 1);
      }
    });
    this.addClass('closed');
    this.show();

  }

  Chat.p = Chat.prototype = $('#c2m-chat');
  Chat.p.elements = function (elements) {
    for (let name in elements) {
      let id = elements[name];
      let child = $('#' + id);
      child.length ? this[name] = child : this.throwException(`Не найден элемент по id = ${params['id']}`);
    }
  }
  Chat.p.throwException = function (message) {
    throw message;
  }
  Chat.p.openOrClose = function () {
    this.toggleClass('closed');
    if (this.hasClass('closed')) this.draggable('disable');
    else {
      this.draggable('enable');
      this.inputMessage.focus();
    }
  }
  Chat.p.convertBreakes = function (text) {
    let paragraphs = text.split('\n');
    let result = [];
    for (let paragraph of paragraphs) {
      result.push($('<div>').text(paragraph));
    }
    return result;
  }
  Chat.p.createMessage = function () {
    let msgBody = this.inputMessage.val()
    /*let message =
      $('<div>', {
        'class': 'message f j-e',
      })
      .append($('<div>', {
        'class': 'msg-left-col',
      }))
      .append($('<div>', {
          'class': 'msg-center-col f col',
        })
        .append($('<div>', {
          'class': 'msg-head f a-e',
        }))
        .append($('<div>', {
          'class': 'msg-body',
        })).text(msgBody))
      .append($('<div>', {
          'class': 'msg-right-col f col j-b',
        })
        .append($('<div>', {
          'class': 'msg-timestamp f a-e ',
        })));*/

    let message = $(
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
    </div>`);
    this.messagesList.scrollable.prepend(message);
    this.inputMessage.height(25);
    this.inputMessage.val('');
    this.resetMaxScrollY();
  }
  Chat.p.resetMaxScrollY = function () {
    this.messagesList.maxScrollY = this.messagesList.scrollable[0].scrollHeight - (this.messagesList.height())
  }

  let chat = new Chat();
  console.log(chat);

  // Dev tool
  $.chat = function (userId, roomId) {
    chat.data('session', JSON.stringify({
      'userId': userId,
      'roomId': roomId,
    }));
    return chat.data('session');
  };
});