<?php

namespace Base\App;

class DB{
    static $db = null;
    static function getDB(){
        if(self::$db == null){
            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_OBJ
            ];
            self::$db = new \PDO("mysql:host=localhost;dbname=busanmusic;charset=utf8mb4","root","",$options);
        }
        return self::$db;
    }

    static function query($sql,$data = []){
        $q = self::getDB()->prepare($sql);
        return $q->execute($data);
    }

    static function fetch($sql,$data=[]){
        $q = self::getDB()->prepare($sql);
        $q->execute($data);
        return $q->fetch(); 
    }

    static function fetchAll($sql,$data=[]){
        $q = self::getDB()->prepare($sql);
        $q->execute($data);
        return $q->fetchAll(); 
    }
}