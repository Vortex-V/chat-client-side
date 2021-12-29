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


    /* session */
    // TEST
    let test = {
      'user_id': '1',
      'session_id': '2',
      'user_displayed_name': 'Kolya',
    }
    this.data('session', JSON.stringify(test));
    // TEST


    let data = JSON.parse(this.data('session'));
    this.session = {
      userId: data['user_id'],
      sessionId: data['session_id'],
      userDisplayedName: data['user_displayed_name'],
    };
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
    let msgBody = this.inputMessage.val();
    // TODO: создать "сборщик" сообщения в соответствии с передаваемыми в метод данными
    if (msgBody) {
      this.messagesList.scrollable.prepend(`<div class="message f">
      <div class="msg-left-col">
        <img src="files/users_default_avatars/User avatar (1).png" alt="User">
      </div>
      <div class="f col msg-center-col">
        <div class="f a-e msg-head">
        ${this.session.userDisplayedName}
        </div>
        <div class="msg-body">
        ${msgBody}
        </div>
      </div>
      <div class="f col j-b msg-right-col">
        <div class="f a-e msg-timestamp">9:00</div>
      </div>
    </div>`)
      this.inputMessage.height(25);
      this.inputMessage.val('');
      this.resetMaxScrollY();
    }
  }
  Chat.p.resetMaxScrollY = function () {
    this.messagesList.maxScrollY = this.messagesList.scrollable[0].scrollHeight - (this.messagesList.height())
  }

  let chat = new Chat();
  console.log(chat);
})