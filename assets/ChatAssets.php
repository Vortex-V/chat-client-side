<?php

namespace app\modules\chat;

use yii\bootstrap4\BootstrapAsset;
use yii\web\JqueryAsset;

class ChatAssets extends \yii\web\AssetBundle
{
    public $sourcePath = __DIR__ . '/';
    public $css = [
        'css/style.css'
    ];
    public $js = [
        'js/app.js'
    ];
    public $depends = [
        JqueryAsset::class,
        JqueryUIAsset::class,
        BootstrapAsset::class
    ];
}