<?php

namespace vortex_v\chat_client_side;

use app\modules\chat\ChatAssets;
use yii\base\Widget;

class Chat extends Widget
{
    public function init()
    {
        parent::init();
        ChatAssets::register($this->view);
    }

    /**
     * @inheritDoc
     */
    public function run(): string
    {
        // return $this->renderFile(sprintf("@app%s/views/index.php", self::$vendorPath), ['test' => 'Я порвался, но оно работает как модуль']);
        return $this->render('index', ['test' => 'Я порвался, но оно работает как модуль']);
    }
}