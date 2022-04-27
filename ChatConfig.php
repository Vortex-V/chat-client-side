<?php

namespace vortex_v\chat_widget;

trait ChatConfig
{
    /**
     * [
     *  'userId' => 1,
     *  'roomId' => 1
     * ]
     * @var array
     */
    public array $session;

    /**
     * Например
     * [
     *  'position' => 'fixed'
     * ]
     * @var array
     */
    public array $css;

    public bool $draggable;

    public bool $dev;
}