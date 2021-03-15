<?php

function myLoader($name){
    $prefix = "Base\\";
    $base_dir = __DIR__."/src/";
    $prefixLen = strlen($prefix);

    if(strncmp($prefix,$name,$prefixLen) == 0){
        $realName = substr($name,$prefixLen);
        $realName = str_replace("\\","/",$realName);
        $file = "{$base_dir}{$realName}.php";
        if(file_exists($file)){
            include_once $file;
        }
    }
}

spl_autoload_register("myLoader");