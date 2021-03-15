<?php

use Base\App\Route;

// All

// search
Route::get("/searchMusic","MainController@searchmusicProcess");
Route::get("/searchWord","MainController@searchWord");
Route::get("/searchwordIn","MainController@searchwordIn");

// Page
Route::get("/",'MainController@indexPage');
Route::get("/library","MainController@libraryPage");
Route::get("/queue","MainController@queuePage");
Route::get("/index","MainController@indexPage");
Route::get("/playlist","MainController@playlistPage");
Route::get("/search","MainController@searchPage");

// Data-process
Route::get("/musiclistget","MainController@musicget");
Route::get("/playlistget","PlaylistController@playlistget");
Route::post("/dbset","MainController@dbset");

// Not user
Route::post("/login","MainController@login");

// User
Route::post("/logout","MainController@logout");
Route::post("/playlistadd","PlaylistController@playlistAdd");
Route::post("/playlistupdate","PlaylistController@playlistUpdate");
Route::post("/playlistremove","PlaylistController@playlistRemove");