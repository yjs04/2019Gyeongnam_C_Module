<?php

session_start();
define("ROOT",dirname(__DIR__));
define("SRC",ROOT."/src/");
include_once ROOT."/autoload.php";
include_once ROOT."/web.php";
include_once ROOT."/Lib.php";
Base\App\Route::route();