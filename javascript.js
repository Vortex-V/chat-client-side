$(() => {
  let Chat = function () {
    this.addClass('closed');

    this.setElementsById({
      'topPanel': 'chat-top-panel',
      'inputMessage': 'chat-input-msg',
      'inputLinesCountChecker': 'chat-input-lines-count-checker',
      'messagesList': 'chat-msgs-list',
      'buttonSendMessage': 'chat-send-message',
    });

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
        this.resetMaxScrollY(); // TODO: после реализации функционала подгрузки сообщений с БД, перенести
      }, 500);
      topPanel.click(click);
    }, );

    this.draggable({
      handle: topPanel,
      stack: this,
      disabled: true,
      start: function (event, ui) {
        topPanel.click.canClick = false;
      },
      stop: function () {
        setTimeout(() => {
          topPanel.click.canClick = true;
        }, 1);
      }
    });


    /* inputMessage & inputLinesCountChecker */
    let inputMessage = this.inputMessage;
    let inputLinesCountChecker = this.inputLinesCountChecker;
    inputMessage.on('input', () => {
      let text = inputMessage.val();
      text = this.convertBreakes(text);
      let div = $("<div>").append(text);
      let inputedText = inputLinesCountChecker.children('div');
      inputedText.replaceWith(div);
     // let linesCount = Math.floor(this.inputLinesCountChecker.height() / 25);
      /*let i = text.indexOf('\n');
      while (i != -1) {
        linesCount++;
        i = text.indexOf('\n', i + 1);
      }*/
      //inputMessage.height(25 * linesCount);
      inputMessage.height(inputLinesCountChecker.height());
    });
    inputMessage.keydown((e) => {
      if (e.key == 'Enter' && e.ctrlKey) {
        this.sendMessage();
      };
    });


    /* buttonSendMessage */
    this.buttonSendMessage.click(()=>{
      this.sendMessage();
    });

    /* messagesList */
    let messagesList = this.messagesList;
    messagesList.scrollable = messagesList.children('.scrollable');
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
  };

  Chat.p = Chat.prototype = $('#c2m-chat');

  Chat.p.setElementsById = function (elements) {
    for (let name in elements) {
      let id = elements[name];
      let child = $('#' + id);
      child.length ? this[name] = child : this.throwException('setChild', null, {
        'id': id
      });
    }
  }

  Chat.p.openOrClose = function () {
    this.toggleClass('closed');
    if (this.hasClass('closed')) this.draggable('disable');
    else {
      this.draggable('enable');
      this.inputMessage.focus();
    }
  }

  Chat.p.resetMaxScrollY = function () {
    this.messagesList.maxScrollY = this.messagesList.scrollable[0].scrollHeight - (this.messagesList.height())
  }

  Chat.p.sendMessage = function () {
    let msgBody = this.inputMessage.val();
    if (msgBody) {
      this.messagesList.scrollable.prepend(`<div class="message f">
      <img src="files/users_default_avatars/User avatar (1).png" alt="User">
      <div class="f col">
          <div class="f a-e head username">
              ${this.session.userDisplayedName}
          </div>
          <div class="msg-body">
              ${msgBody}
          </div>
      </div>
      <div class="f head">
          <div class="f a-e time">9:00</div>
      </div>
  </div>`)
      this.inputMessage.height(25);
      this.inputMessage.val('');
      this.resetMaxScrollY();
    }

  }

  Chat.p.convertBreakes = function (text) {
    let lines = text.split('\n');
    let result = [];
    for (let line of lines) {
      result.push($('<div>').text(line));
    }
    return result;
  }

  Chat.p.throwException = function (type, message = null, params = null) {
    switch (type) {
      case 'setChild':
        throw `Не удалось найти DOM объект по id = ${params['id']}`;
      default:
        break;
    }
  }



  let chat = new Chat();
  chat.show();
  console.log(chat);
})
