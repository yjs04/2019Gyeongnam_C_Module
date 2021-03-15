class App{
    static ls = localStorage;
    static save(key,val){return App.ls.setItem(key,JSON.stringify(val))}
    static load(key) {return App.ls.getItem(key) || false}
    static Login;

    constructor(){
        this.loginCheck();
        this.Event();
        this.playList = [];
        this.Q = new queue();
        this.buttonstatus();
        this.PageLoad();
        this.dbCheck();
        this.userinfo();
        this.notuserover = 1;
    }

    loginCheck(){
        App.Login = document.querySelector("#login") ? false : true;
    }

    loadMusic(){
        return new Promise(res => {
            let data = App.load("music_list");
            if(data) res(JSON.parse(data));
            else {
                fetch("/json/music_list.json")
                .then(data => data.json())
                .then(async data => {
                    this.musicList = await Promise.all(data.map(async x => {
                                        x.duration = await this.getDuration(x.url);
                                        return x;
                                    }));
                    res(data);
                });
            }
        });
    }

    getDuration(filename){
        return new Promise(res => {
            fetch("music/"+filename)
            .then(data => data.arrayBuffer())
            .then(data => {
                new AudioContext().decodeAudioData(data).then(value => res(value.duration));
            });
        });
    }

    dbCheck(){
        let vs = [];
        let name = ["music_list","members","playlists"];
        for(let i = 0; i< 3; i++){
            if(i == 0){
                this.loadMusic().then((v)=>{
                    vs.push(v);
                });
            }else{
                fetch(`/json/${name[i]}.json`)
                .then(v => v.json())
                .then(v =>{
                    v = i == 0 ? v : i == 1 ? v['members'] : v['list'];
                    vs.push(v);
                    if(i==2)this.dbCheckp(vs);
                });
            }
        }
        App.Login = document.querySelector("#login") ? false : true;
    }

    dbCheckp(values){
        for(let i = 0; i<3; i++){
            $.ajax({
                url:"/dbset",
                method:"post",
                data:{"status":i,"data":values[i]},
                success:(data)=>{
                    if(JSON.parse(data) !== false && i == 2){
                        this.setLocaldb();
                    }
                }
            });
        }
    }

    setLocaldb(){
        if(JSON.parse(App.load("music_list"))== false){
            $.ajax({
                url:"/musiclistget",
                method:"get",
                success:(data)=>{
                    if(JSON.parse(data) !== []) App.save("music_list",JSON.parse(data));
                    this.musicgenre(JSON.parse(data));
                }
            });
        }

        if(App.Login && !JSON.parse(App.load("play_list"))){
            $.ajax({
                url:"/playlistget",
                method:"get",
                success:(data)=>{
                    if(JSON.parse(data) !== false){
                        App.save("play_list",JSON.parse(data));
                    }
                }
            });
        }
    }

    userinfo(){
        window.addEventListener("click",(e)=>{
            // login
            if(e.target.id == "login_button"){
                let id = document.querySelector("#login_id").value,password = document.querySelector("#login_password").value;
                if(id == "" || password == "" ) alert("내용을 입력해주세요!");
                else{
                    $.ajax({
                        url:"/login",
                        method:"post",
                        data:{"id":id,"password":password},
                        success:(data)=>{
                            if(JSON.parse(data) == false) alert("아이디와 패스워드가 일치하지 않습니다.");
                            else{
                                alert('로그인이 되었습니다.');
                                $("#login_check").prop("checked",false);
                                document.querySelector("nav").removeChild(document.querySelector("#login"));
                                document.querySelector("nav").innerHTML += `<label class="nav_ul" id="logout">Logout</label>`;
                                document.querySelector("#login_id").value = "";
                                document.querySelector("#login_password").value = "";
                                App.Login = true;
                                $.ajax({
                                    url:"/playlistget",
                                    method:"get",
                                    success:(data)=>{
                                        if(JSON.parse(data) !== false) App.save("play_list",JSON.parse(data));
                                        this.PageLoad();
                                    }
                                });
                            }
                        }
                    });
                }
            }
            
            // logout
            if(e.target.id == "logout"){
                $.ajax({
                    url:"/logout",
                    method:"post",
                    success:(data)=>{
                        if(JSON.parse(data) == false) alert("로그아웃 도중 문제가 발생했습니다.");
                        else{
                            alert("로그아웃 되었습니다.");
                            document.querySelector("nav").removeChild(document.querySelector("#logout"));
                            document.querySelector("nav").innerHTML += `<label class="nav_ul" for="login_check" id="login">Login</label>`;
                            document.querySelector("#login_id").value = "";
                            document.querySelector("#login_password").value = "";
                            App.Login = false;
                            App.save("recent_list",[]);
                            App.save("play_list",[]);
                            App.save("recommen_list",[]);
                            this.PageLoad();
                        }
                    }
                });
            }
        });

        window.addEventListener("change",(e)=>{
            if(e.target.id == "login_check"){
                if(!e.target.checked){
                    document.querySelector("#login_id").value = "";
                    document.querySelector("#login_password").value = "";
                }
            }
        });
    }

    musicgenre(array){
        this.mainList = ["추천 노래"];
        let check = 0;
        array.forEach(element => {
            check = 0;
            this.mainList.forEach(item =>{
                if(element['genre'] == item) check = 1;
            });
            if(!check) this.mainList[this.mainList.length] = element['genre'];
        });

        let randMusic = [],checks = 0;
        for(let i = 0; i<5; i++){
            let rand = 0;
            do{
                rand = Math.floor(Math.random() * 31);
                checks = randMusic.findIndex(v => v == rand);
                checks = checks == -1 ? false : true;
            }while(checks);
            randMusic.push(rand);
        }
        
        this.mainList.forEach(element => {
            let title = element;
            if(element == "") title = "기타";
            let list =`
            <!-- music area-->
                <div class="music_list_area">
                    <h4 class="music_list_area_title">${title}</h4>
                    <div class="music_list_area_box">
                        <!-- music_list_area_box-->
                    `;
                    if(element == "추천 노래"){
                        for(let i = 0; i<5;i++) list +=  this.createMusic(array[randMusic[i]]);
                    }
                    else 
                    {
                        let count = 0;
                        array.forEach(music =>{
                            if(count < 5 && music['genre'] == element){
                                count++;
                                list += this.createMusic(music);
                            }
                        });
                    }
                    list+=`
                    </div>
                </div>
            `;
            document.querySelector("#music_list").innerHTML += list;
        });
    }

    buttonstatus(){
        window.addEventListener("click",(e)=>{
            if(e.target.id == "music_play_repeat" || (e.target.parentNode && e.target.parentNode.id == "music_play_repeat")) this.MusicRepeat();
            if(e.target.id == "music_play_start" || (e.target.parentNode && e.target.parentNode.id == "music_play_start") ) this.musicPlay();
            if(e.target.id == "music_play_last" || (e.target.parentNode && e.target.parentNode.id == "music_play_last") ) this.musicLast();
            if(e.target.id == "music_play_next" || (e.target.parentNode && e.target.parentNode.id == "music_play_next")) this.musicNext();

            if(e.target.classList.contains("music_list_button") || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("music_list_button")) || ( e.target.classList.contains("play_now_box_play") ) || (e.target.classList.contains("play_now_box_play_icon")) || (e.target.classList.contains("search_hover_button")) || (e.target.classList.contains("search_hover_button_icon")) ) this.musicPlayButton(e.target.getAttribute("data-id"));
        });
        switch(JSON.parse(App.load("repeat_status"))){
            case 1 :document.querySelector("#music_play_repeat p").innerText = "노래반복"; break;
            case 2 :document.querySelector("#music_play_repeat p").innerText = "대기열 반복"; break;
            default :document.querySelector("#music_play_repeat p").innerText = "반복안함"; break;
        }
    }

    PageLoad(){
        if(document.querySelector("#Library_playlist_content")) this.LibrarySet();
        if(document.querySelector("#music_list") && JSON.parse(App.load("music_list")) !== false) this.musicgenre(JSON.parse(App.load("music_list")));
        if(document.querySelector("#playlist_music") && document.querySelector("#playlist_music").classList.contains("queue")) this.Q.createMusic();
        if(document.querySelector("#playnowlist") && JSON.parse(App.load("recent_list")) !== false && App.Login) this.RecentSet();
        if(document.querySelector("#playnowlist") && App.Login == false) document.querySelector("#play_now_list_area").innerHTML = "";
        if(document.querySelector("#search_content")){
            fetch("/search")
            .then(v => v.text())
            .then(v => {
                let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                if(reg.exec(v)){
                    let content = reg.exec(v)[1];
                    document.querySelector("#content").innerHTML = content;
                }
            });
        }
    }

    searchProcess(){
        let searchAction = (e)=>{
            e.preventDefault();
            e.stopPropagation();
            let search_word = document.querySelector("#search_input").value;
            document.querySelector("#search_input").value = "";
            if(search_word !== ""){
                document.querySelector("body").removeChild(document.querySelector("#recent_search_box"));
                $.ajax({
                    url:"/searchwordIn",
                    method:"get",
                    data:{"search_word":search_word},
                    success:(data)=>{
                        console.log(data);
                    }
                });
                $.ajax({
                    url:"/searchMusic",
                    method:"get",
                    data:{"search_word":search_word},
                    success:(data)=>{
                        if(JSON.parse(data) !== false){
                            history.pushState({data:""},null,"/search");
                            fetch("/search")
                            .then(v => v.text())
                            .then(v => {
                                let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                                if(reg.exec(v)){
                                    let content = reg.exec(v)[1];
                                    document.querySelector("#content").innerHTML = content;
                                    let loading = document.createElement("div");
                                    loading.id = "Loading";
                                    loading.innerHTML = `<div class="loading_circle"></div>`;
                                    document.querySelector("body").appendChild(loading);
                                    setTimeout(()=>{
                                        document.querySelector("body").removeChild(document.querySelector("#Loading"));
                                        this.SearchSet(JSON.parse(data),search_word);
                                        if(App.Login) this.SearchList(JSON.parse(data));
                                    },500);
                                }
                            });
                        }
                    }
                });
            }
        }

        $("#search").bind('submit',searchAction);
    }

    SearchList(value){
        let playlist = JSON.parse(App.load("play_list"));
        let search_list = [];
        if(playlist.length > 0){
            if(value.length > 0){
                document.querySelector("#search_list_result").innerHTML = "";
                value.forEach( item =>{
                    playlist.forEach((i,idx) =>{
                        let check = false;
                        i['list'].findIndex((value =>{if(value == item['idx']) check = true;}));
                        if(check){
                            let c = 1;
                            search_list.findIndex(v =>{c = v[0]['id']== i['id'] ? 0 : c;});
                            if(c) search_list.push([i,idx]);
                        }
                    });
                });
                if(search_list.length  > 0) this.SearchListBox(search_list);
            }else document.querySelector("#search_list_result").innerHTML = `<p class="search_not">검색 결과가 없습니다.</p>`;
        }
    }

    SearchListBox(value){
        let musiclist = JSON.parse(App.load("music_list"));
        value.forEach(box =>{
            let b = document.createElement("div");
            b.classList.add("search_box");
            b.innerHTML=`
                <img src="/image/${musiclist[parseInt(box[0]['list'][0])]['albumImage']}" alt="search_cover" class="search_cover">
                <div class="search_info">
                    <p class="search_title">${box[0]['name']}</p>
                </div>
                <div class="search_hover list" id="searchList_${box[1]}" value = "${box[1]}">
                    <button class="search_list_hover_button" id="searchList_${box[1]}" value = "${box[1]}" data-id="${box[1]}" data-num = "${box[1]}">
                        <i class="fa fa-play search_list_hover_button_icon" data-id="${box[1]}"></i>
                    </button>
                </div>
            `;
            document.querySelector("#search_list_result").appendChild(b);
        });
    }

    SearchSet(value,search_word){
        document.querySelector("#search_word").innerHTML = `"${search_word}" 의 검색결과`;
        document.querySelector("#search_music_result").innerHTML = "";
        if(value.length == 0){
            document.querySelector("#search_music_result").innerHTML = `<p class="search_not">검색 결과가 없습니다.</p>`;
        }else{
            value.forEach(item =>{
                this.SearchSetBox(item);
            });
        }
    }

    SearchSetBox(value){
        let box = document.createElement("div");
        box.classList.add("search_box");
        box.innerHTML = `
        <img src="/image/${value['albumImage']}" alt="search_cover" class="search_cover">
        <div class="search_info">
            <p class="search_title">${value['name']}</p>
            <p class="search_artist">${value['artist']}</p>
        </div>
        <div class="search_hover" id="search_${parseInt(value['idx'])}">
            <button class="search_hover_button" data-id="${parseInt(value['idx'])}">
                <i class="fa fa-play search_hover_button_icon" data-id="${parseInt(value['idx'])}"></i>
            </button>
        </div>
        `;
        document.querySelector("#search_music_result").appendChild(box);
    }

    Event(){
        this.searchProcess();

        document.querySelector("#search_input").addEventListener("focus",(e)=>{
            e.preventDefault();
            if(!document.querySelector("#recent_search_box")){
                let recent_search = document.createElement("div");
                recent_search.id="recent_search_box";
                recent_search.innerHTML = `
                <p id="recent_search_title">최근 검색어</p>
                <div id="recent_search_content">
                </div>
                `;
                recent_search.style.left = e.target.offsetLeft+"px";
                document.querySelector("body").appendChild(recent_search);
                $.ajax({
                    url:"/searchWord",
                    method:"get",
                    success:(data)=>{
                        if(document.querySelector("#recent_search_content") && JSON.parse(data).length > 0){
                            JSON.parse(data).forEach(item =>{
                                document.querySelector("#recent_search_content").innerHTML +=`<p class="recent_search_value"><i class="fa fa-search recent_search_value_icon"></i>${item['search_word']}</p>`;
                            });
                        }
                    }
                })
            }
        });

        document.querySelector("#search_input").addEventListener("focusout",(e)=>{if(document.querySelector("#recent_search_box"))document.querySelector("body").removeChild(document.querySelector("#recent_search_box"));});

        window.addEventListener('contextmenu', function() {event.preventDefault();});

        window.addEventListener('mousedown', (e)=>{
          if ((e.button == 2) || (e.which == 3)) {
            if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            
            if(document.querySelector("#queue_content")){
                if(e.target.classList.contains("playlist_music") || ( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music")) || ( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music")) ){
                    let idx;
                    if(e.target.classList.contains("playlist_music")) idx = Number(e.target.id.splice("_")[1]);
                    if(( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.id.split("_")[1]);
                    if(( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.parentNode.id.split("_")[1]);
                    let item = `
                    <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${idx}">플레이리스트에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="remove_wating" value = "${idx}">대기열에서 삭제</button>`;
                    this.RightMenuMake(item,e);
                }
            }

            if(e.target.classList.contains("music_list_area_music_hover")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play" value = "${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="add_wating" value = "${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(e.target.classList.contains("play_now_box_hover")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="play_remove" value="${e.target.getAttribute("data-id")}">재생기록 삭제</button>
                <button class="RightMenuBtn RightMenu" id="add_playlist" value="${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play" value="${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="add_wating" value="${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(e.target.classList.contains("Library_playlist_box_hover")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="play_playlist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트 재생</button>
                <button class="RightMenuBtn RightMenu" id="playlist_addPlaylist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play_PlayList" data-id = "${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="playList_addWating" data-id = "${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                <button class="RightMenuBtn RightMenu" id="remove_playlist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트 삭제</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(document.querySelector("#playlist_content")){
                let check = (e.target.className && e.target.classList.contains("playlist_music") ) || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("playlist_music")) || (e.target.parentNode.parentNode && e.target.parentNode.parentNode.className && e.target.parentNode.parentNode.classList.contains("playlist_music"));
                if(check){
                    let data,num;
                    if((e.target.className && e.target.classList.contains("playlist_music") )){
                        data = parseInt(e.target.getAttribute("data-id"));
                        num = parseInt(e.target.getAttribute("data-num"));
                    }
                    else if((e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("playlist_music"))){
                        data = parseInt(e.target.parentNode.getAttribute("data-id"));
                        num = parseInt(e.target.parentNode.getAttribute("data-num"));
                    }
                    else if((e.target.parentNode.parentNode && e.target.parentNode.parentNode.className && e.target.parentNode.parentNode.classList.contains("playlist_music"))){
                        data = parseInt(e.target.parentNode.parentNode.getAttribute("data-id"));
                        num = parseInt(e.target.parentNode.parentNode.getAttribute("data-num"));
                    }
                    else{
                        data =false;
                        num = false;
                    }
                    let list = document.querySelector("#playlist_music").getAttribute("data-id");
                    let item = `
                    <button class="RightMenuBtn RightMenu" id="add_playlist" value = "${data}">플레이리스트에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="next_play" value = "${data}">다음 음악으로 재생</button>
                    <button class="RightMenuBtn RightMenu" id="add_wating" value = "${data}">대기열에 추가</button>
                    <button class="RightMenuBtn RightMenu" id="music_remove_playlist" data-num="${num}" data-playlist = "${list}" value = "${data}">플레이리스트에서 삭제</button>
                    `;
                    if(data !== false) this.RightMenuMake(item,e);
                }
            }

            if(e.target.classList.contains("search_hover") && e.target.classList.contains("list")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="playlist_addPlaylist" data-id = "${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play_PlayList" data-id = "${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="playList_addWating" data-id = "${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

            if(e.target.classList.contains("search_hover") && !e.target.classList.contains("list")){
                let item = `
                <button class="RightMenuBtn RightMenu" id="add_playlist" value="${Number(e.target.id.split("_")[1])}">플레이리스트에 추가</button>
                <button class="RightMenuBtn RightMenu" id="next_play" value="${Number(e.target.id.split("_")[1])}">다음 음악으로 재생</button>
                <button class="RightMenuBtn RightMenu" id="add_wating" value="${Number(e.target.id.split("_")[1])}">대기열에 추가</button>
                `;
                this.RightMenuMake(item,e);
            }

          }
        });

        window.addEventListener("click",(e)=>{
            if(e.target.id == "music_play_text_open" || e.target.id == "music_play_text_open_icon") this.open_musicText();
            if(document.querySelector("#RightMenu") && !e.target.classList.contains('RightMenu') && !e.target.classList.contains("playListMenu_box")){
                if((!e.target.classList.contains("playListMenuBtn") &&!e.target.classList.contains("playListMenuCheck")) && (!e.target.classList.contains("playListMenuBtn") &&!e.target.classList.contains("PlayListCheck")) ){
                    if(document.querySelector("#playlistMenu")) document.querySelector("body").removeChild(document.querySelector("#playlistMenu"));
                    document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                } 
            }
            if(document.querySelector("#add_wating") && e.target.id == "add_wating"){
                let list = [];
                if(App.load("queue_list")) list = JSON.parse(App.load("queue_list"));
                list.push(Number(document.querySelector("#add_wating").value));
                App.save("queue_list",list);
                App.save("max_queue",list.length - 1);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            }

            if(document.querySelector("#add_playlist") && e.target.id == "add_playlist") this.AddPlayList(e.target.value);

            if(document.querySelector("#next_play") && e.target.id == "next_play") this.nextPlay(e.target.value);

            if(document.querySelector("#music_remove_playlist") && e.target.id == "music_remove_playlist"){
                let list_num = e.target.getAttribute("data-playlist");
                let playList = JSON.parse(App.load("play_list")),num = parseInt(e.target.getAttribute("data-num"));
                playList[list_num]['list'].splice(num,1);
                playList[list_num]['num']--;
                App.save("play_list",playList);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                document.querySelector("#playlist_music").innerHTML = "";
                document.querySelector("#playlist_info").innerHTML = `
                <p id="playlist_title"></p>
                <p id ="playlist_musicnum"></p>
                `;
                this.PlayListPageSet(list_num);
            }

            if(e.target.id == "remove_wating"){
                let remove_idx = document.querySelector("#remove_wating").value;
                let list = [];
                list = JSON.parse(App.load("queue_list"));
                list.splice(list.indexOf(remove_idx.toString()),1);
                App.save("queue_list",list);
                App.save("max_queue",list.length - 1);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                this.Q.createMusic();
            }

            if(document.querySelector("#queue_content")){
                if(e.target.classList.contains("playlist_music") || ( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music")) || ( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music")) ){
                    let idx;
                    if(e.target.classList.contains("playlist_music")) idx = parseInt(e.target.getAttribute("data-num"));
                    if(( e.target.parentNode && e.target.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.getAttribute("data-num"));
                    if(( e.target.parentNode.parentNode && e.target.parentNode.parentNode.classList.contains("playlist_music"))) idx = Number(e.target.parentNode.parentNode.getAttribute("data-num"));
                    App.save("now_queue",idx);
                    document.querySelector("#music_play_start").setAttribute("data-id",1);
                    this.musicPlay();
                }
            }

            if((e.target.classList.contains("Library_playlist_box_hover_btn") || (e.target.parentNode && e.target.parentNode.className && e.target.parentNode.classList.contains("Library_playlist_box_hover_btn"))) || (e.target.id == "play_playlist") || (e.target.id == "playlist_all_play") || (e.target.classList.contains("playlist_play_icon")) || (e.target.classList.contains("search_list_hover_button")) || (e.target.classList.contains("search_list_hover_button_icon")) ){
                let idx;
                if((e.target.parentNode && e.target.parentNode.classList.contains("Library_playlist_box_hover_btn")) || (e.target.classList.contains("playlist_play_icon"))) idx = Number(e.target.parentNode.getAttribute("data-id"));
                else idx = Number(e.target.getAttribute("data-id"));
                
                let list = JSON.parse(App.load("play_list"))[idx];
                App.save("queue_list",list['list']);
                App.save("max_queue",parseInt(list['list'].length)-1);
                App.save("now_queue",0);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                this.musicPlay();
            }

            if( (e.target.id == "next_play_PlayList") || (e.target.id == "playlist_next_add") || (e.target.classList.contains("playlist_next_add_icon")) ){
                let idx;
                if((e.target.classList.contains("playlist_next_add_icon"))) idx = e.target.parentNode.getAttribute("data-id");
                else idx = e.target.getAttribute("data-id");
                if(idx !== null){
                    let queue_list = JSON.parse(App.load("queue_list"));
                    let max_num = JSON.parse(App.load("max_queue"));
                    let list = JSON.parse(App.load("play_list"))[idx];
                    let now_queue = JSON.parse(App.load("now_queue"));
                    list['list'].forEach((item,id) =>{
                        queue_list.splice((id+now_queue+1),0,item);
                    });
                    App.save("queue_list",queue_list);
                    App.save("max_queue",max_num + list['list'].length);
                    if(document.querySelector("#RightMenu")) document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                }
            }

            if(e.target.id == "playList_addWating"){
                let idx = e.target.getAttribute("data-id");
                let queue_list = JSON.parse(App.load("queue_list"));
                let max_num = JSON.parse(App.load("max_queue"));
                let list = JSON.parse(App.load("play_list"))[idx];
                list['list'].forEach(item =>{
                    queue_list.push(item);
                });

                App.save("queue_list",queue_list);
                App.save("max_queue",max_num + list['list'].length);
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
            }

            if(e.target.id == "remove_playlist"){
                let idx = e.target.getAttribute("data-id");
                let playList = JSON.parse(App.load("play_list"));
                $.ajax({
                    url:"/playlistremove",
                    method:"post",
                    data:{"id":playList[idx]['id']},
                    success:(data)=>{
                        if(JSON.parse(data) !== false){
                            $.ajax({
                                url:"/playlistget",
                                method:"get",
                                success:(data)=>{
                                    if(JSON.parse(data) !== false){
                                        App.save("play_list",JSON.parse(data));
                                        document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                                        document.querySelector("#Library_playlist_content").innerHTML = "";
                                        this.LibrarySet();
                                        if(document.querySelector("#RightMenu"))document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                                    }
                                }
                            });
                        }
                    }
                });
            }

            if(e.target.id == "playlist_addPlaylist"){
                if(App.Login){
                    let id = e.target.getAttribute("data-id");
                    let playList = JSON.parse(App.load("play_list"))[id];

                    if(document.querySelector("#RightMenu")){
                        let list = JSON.parse(App.load("play_list"));
                        let Box = document.createElement("div");
                        Box.id = "playlistMenu";
                        if(list){
                            let checked = "",disabled = "";
                            list.forEach((item,idx)=>{
                                checked = id == idx ? "checked" : "";
                                if(checked == ""){
                                    let cc = 1;
                                    playList['list'].forEach(value =>{
                                        let c = item['list'].findIndex((el) => value == el);
                                        cc = c == -1 ? 0 : cc;
                                    });
                                    checked = cc == 1 ? "checked" : "";
                                }
                                disabled = id == idx ? "disabled" : "";
                                Box.innerHTML += `<div class = 'playListMenu_box'>
                                <input type="checkbox" id="list_${idx}" class = "PlayListCheck" data-id = "${idx}" data-num = "${id}" ${checked} ${disabled}>
                                <label for="list_${idx}" class='playListMenuBtn' id='play_${idx}'>${item['name']}</label>
                                </div>`;
                            });
                        }
                        Box.innerHTML += `<button class="playListMenuNew">새 재생목록</button><button class="playListMenuOut">닫기</button>`;
                        document.querySelector("body").appendChild(Box);
                        Box.style.left = parseInt($("#RightMenu").css("left")) + 200 + "px";
                        Box.style.top = $("#RightMenu").css("top");
                    }
                }else{
                    alert("로그인 후 이용할 수 있습니다!");
                    $("#login_check").prop("checked",true);
                }
            }

            if(e.target.classList.contains("Library_playlist_box_hover")){
                fetch("/playlist")
                    .then(v => v.text())
                    .then(v => {
                        let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                        if(reg.exec(v)){
                            let content = reg.exec(v)[1];
                            document.querySelector("#content").innerHTML = content;
                            let loading = document.createElement("div");
                            loading.id = "Loading";
                            loading.innerHTML = `<div class="loading_circle"></div>`;
                            document.querySelector("body").appendChild(loading);
                            setTimeout(()=>{
                                document.querySelector("body").removeChild(document.querySelector("#Loading"));
                                this.PlayListPageSet(Number(e.target.id.split("_")[1]));
                            },500);
                        }
                    });
            }

            if(e.target.classList.contains("playlist_hover_start") || e.target.classList.contains("playlist_hover_start_icon")){
                let id = parseInt(e.target.getAttribute("data-id"));
                App.save("queue_list",[id]);
                App.save("now_queue",0);
                App.save("max_queue",0);
                App.save("recommen_list",[]);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                this.musicPlay();
                document.querySelector("#Right")
            }

            if(e.target.id == "play_remove"){
                let id = e.target.value;
                let recent = JSON.parse(App.load("recent_list"));
                recent.splice(id,1);
                App.save("recent_list",recent);
                this.RecentSet();
            }

        });
        
        document.querySelector("#music_play_volum").addEventListener("input",()=>{
            document.querySelector("#music_play_volum_value").innerText = `${document.querySelector("#music_play_volum").value}%`;
            document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
        });

        document.querySelector("#music_prograss_bar").addEventListener("input",()=>{
            if(document.querySelector("#music_audio").duration){
                document.querySelector("#music_audio").currentTime = document.querySelector("#music_prograss_bar").value;
            }
        });

        window.addEventListener("change",(e)=>{

            if(e.target.classList.contains("playListMenuCheck")){
                let item = Number(e.target.getAttribute("data-id"));
                let list = JSON.parse(App.load("play_list"));
                let id = Number(e.target.getAttribute("data-num"));
                let listDB = "";
                if(e.target.checked){
                    if(list[item]['list'].indexOf(id) == -1){
                        list[item]['list'].push(id+"");
                        list[item]['list'].forEach((item,idx) =>{listDB += idx == 0 ? item : ","+item;});
                        $.ajax({
                            url:"/playlistupdate",
                            method:"post",
                            data:{"list":listDB,"id":list[item]['id']},
                            success:(data)=>{
                                if(JSON.parse(data) !== false){
                                    $.ajax({
                                        url:"/playlistget",
                                        method:"get",
                                        success:(data)=>{
                                            if(JSON.parse(data) !== false) App.save("play_list",JSON.parse(data));
                                        }
                                    });
                                }
                            }
                        });
                    }
                }else{
                    if(list[item]['list'].indexOf(id.toString()) !== -1){
                        let ix = list[item]['list'].indexOf(id.toString());
                        list[item]['list'].splice(ix,1);
                        list[item]['list'].forEach((item,idx)=>{listDB += idx == 0? item : ","+item});
                        $.ajax({
                            url:"/playlistupdate",
                            method:"post",
                            data:{"list":listDB,"id":list[item]['id']},
                            success:(data)=>{
                                if(JSON.parse(data) !== false){
                                    $.ajax({
                                        url:"/playlistget",
                                        method:"get",
                                        success:(data)=>{
                                            if(JSON.parse(data)!== false) App.save("play_list",JSON.parse(data));
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }

            if(e.target.classList.contains("PlayListCheck")){
                let item = parseInt(e.target.getAttribute("data-id"));
                let list =JSON.parse(App.load("play_list"));
                let id = parseInt(e.target.getAttribute("data-num"));
                let listDB = "";
                if(e.target.checked){
                    list[id]['list'].forEach(value =>{list[item]['list'].push(value);});
                    list[item]['list'].forEach((value,idx) =>{listDB += idx == 0 ? value : ","+value;});
                    $.ajax({
                        url:"/playlistupdate",
                        method:"post",
                        data:{"list":listDB,"id":list[item]['id']},
                        success:(data)=>{
                            if(JSON.parse(data) !== false){
                                $.ajax({
                                    url:"/playlistget",
                                    method:"get",
                                    success:(data)=>{
                                        if(JSON.parse(data) !== false){
                                            App.save("play_list",JSON.parse(data));
                                            document.querySelector("#Library_playlist_content").innerHTML = "";
                                            this.LibrarySet();
                                        }
                                    }
                                });
                            }
                        }
                    });
                }else{
                    list[id]['list'].forEach(value =>{
                        let i = list[item]['list'].lastIndexOf(parseInt(value));
                        list[item]['list'].splice(i,1);
                    });
                    list[item]['list'].forEach((value,idx)=>{listDB += idx == 0 ? value : ","+value});
                    $.ajax({
                        url:"/playlistupdate",
                        method:"post",
                        data:{"list":listDB,"id":list[item]['id']},
                        success:(data)=>{
                            if(JSON.parse(data) !== false){
                                $.ajax({
                                    url:"/playlistget",
                                    method:"get",
                                    success:(data)=>{
                                        if(JSON.parse(data) !== false){
                                            App.save("play_list",JSON.parse(data));
                                            document.querySelector("#Library_playlist_content").innerHTML = "";
                                            this.LibrarySet();
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }

    LibrarySet(){
        let list = JSON.parse(App.load("play_list"));
        if(App.Login){
            if(list !== false){
                list.forEach((item,idx) =>{
                    document.querySelector("#Library_playlist_content").innerHTML+=this.LibraryPlayList(item,idx);
                });
            }
        }else{
            document.querySelector("#Library_playlist_content").innerHTML = "";
        }
    }

    LibraryPlayList(item,idx){
        let list = JSON.parse(App.load("music_list"));
        let img = item['num'] == 0 ? "" : 'image/'+list[item['list'][0]]['albumImage']; 
        let box = `
        <div class="Library_playlist_box">
            <div class="Library_playlist_box_hover" id="playlist_${idx}">
                <button class="Library_playlist_box_hover_btn" data-id="${idx}">
                    <i class="fa fa-play play"></i>
                </button>
            </div>
            <img src="${img}" alt="playlist_title_img" class="Library_playlist_title_img">
            <div class="Library_playlist_info">
                <p class="Library_playlist_title">${item['name']}</p>
                <p class="Library_playlist_musicNum"> 총 ${item['list'].length}곡</p>
            </div>
        </div>
        `;
        return box;
    }

    AddPlayList(id){
        if(App.Login){
            if(document.querySelector("#RightMenu")){
                let list = JSON.parse(App.load("play_list"));
                let Box = document.createElement("div");
                Box.id = "playlistMenu";
                if(list){
                    let checked = "";
                    list.forEach((item,idx)=>{
                        checked = item['list'].find(e => e == id) == undefined ? "" : "checked";
                        Box.innerHTML += `<div class = 'playListMenu_box'>
                        <input type="checkbox" id="list_${idx}" class = "playListMenuCheck" data-id = "${idx}" data-num = "${id}" ${checked}>
                        <label for="list_${idx}" class='playListMenuBtn' id='play_${idx}'>${item['name']}</label>
                        </div>`;
                    });
                }
                Box.innerHTML += `<button class="playListMenuNew">새 재생목록</button><button class="playListMenuOut">닫기</button>`;
                document.querySelector("body").appendChild(Box);
                Box.style.left = parseInt($("#RightMenu").css("left")) + 200 + "px";
                Box.style.top = $("#RightMenu").css("top");
            }
    
            document.querySelector(".playListMenuOut").addEventListener("click",()=>{
                document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
                document.querySelector("body").removeChild(document.querySelector("#playlistMenu"));
            });
    
            document.querySelector(".playListMenuNew").addEventListener("click",()=>{
                let name = prompt("재생목록의 이름을 설정해주세요");
                if(name !== null){
                    $.ajax({
                        url:"/playlistadd",
                        method:"post",
                        data:{"name":name,"list":id},
                        success:(data)=>{
                            if(JSON.parse(data)!==false){
                                $.ajax({
                                    url:"/playlistget",
                                    method:"get",
                                    success:(data)=>{
                                        if(JSON.parse(data) !== false) App.save("play_list",JSON.parse(data));
                                    }
                                })
                            }
                        }
                    });
                }
            });
        }else{
            alert("로그인 후 이용가능합니다!");
            $("#login_check").prop("checked",true);
            document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
        }
    }

    async PlayListPageSet(id){
        let list = JSON.parse(App.load("play_list"))[id];
        if(id !== null && list){
            
            document.querySelector("#playlist_title").innerHTML = list['name'];
            document.querySelector("#playlist_musicnum").innerHTML = `총 ${list['list'].length}곡`;
            document.querySelector("#playlist_info").innerHTML +=`
            <button data-id="${id}" id="playlist_all_play"><i class="fa fa-play play playlist_play_icon"></i></button>
            <button data-id="${id}" id="playlist_next_add"><i class="fa fa-plus playlist_next_add_icon"></i></button>
            `;
            document.querySelector("#playlist_music").setAttribute("data-id",id);
            for(let i = 0; i<list['list'].length; i++){
                let music_list = JSON.parse(App.load("music_list"))[list['list'][i]];
                await this.playListBox(music_list,i);
            }
            
        }
    }

    playListBox(music_list,idx){
        let box = document.createElement("div");
        box.classList.add("playlist_music");
        box.setAttribute("data-num",idx);
        box.setAttribute("data-id",music_list['idx']);
        box.innerHTML += `
            <img src="image/${music_list['albumImage']}" alt="cover">
            <div class="playlist_music_info">
                <p class="playlist_music_title">${music_list['name']}</p>
                <p class="playlist_music_artist">${music_list['artist']}</p>
                <p class="playlist_music_time">${this.Q.changeTime(music_list['duration'])}</p>
            </div>
            <div class="playlist_cover_hover">
                <button class="playlist_hover_start" data-id="${music_list['idx']}"><i class="fa fa-play playlist_hover_start_icon" data-id="${music_list['idx']}"></i></button>
            </div>
            `;
        document.querySelector("#playlist_music").appendChild(box);
    }

    playlistcalltime(music_list,time){
        let box = document.createElement("div");
        box.classList.add("playlist_music");
        box.setAttribute("data-id",music_list['idx']);
        box.innerHTML += `
            <img src="image/${music_list['albumImage']}" alt="cover">
            <div class="playlist_music_info">
                <p class="playlist_music_title">${music_list['name']}</p>
                <p class="playlist_music_artist">${music_list['artist']}</p>
                <p class="playlist_music_time">${time}</p>
            </div>`;
        document.querySelector("#playlist_music").insertBefore(box,document.querySelector("#playlist_music").firstChild);
        document.querySelector("body").removeChild(document.querySelector("#music_time"));
    }

    nextPlay(idx){
        let list = [];
        if(App.load("queue_list")) list = JSON.parse(App.load("queue_list"));

        let now_idx = JSON.parse(App.load("now_queue"));
        now_idx = now_idx == false ? 0 : now_idx;
        list.splice(now_idx + 1,0,Number(idx));
        App.save("max_queue",now_idx + 1);
        App.save("queue_list",list);
        
        document.querySelector("body").removeChild(document.querySelector("#RightMenu"));
    }

    musicPlayButton(idx){
        App.save("now_queue",0);
        App.save("queue_list",[Number(idx)]);
        App.save("max_queue",0);
        App.save("recommen_list",[]);
        document.querySelector("#music_play_start").setAttribute("data-id",1);
        this.musicPlay();
    }

    musicLast(){
        let now_idx = JSON.parse(App.load("now_queue")),max_idx = JSON.parse(App.load("max_queue"));
        let music_idx = JSON.parse(App.load("queue_list"));
        let music = JSON.parse(App.load("music_list"))[music_idx[now_idx]];
        if(document.querySelector("#music_audio").getAttribute("src") == "music/"+music['url']){
            if(document.querySelector("#music_audio").currentTime >= 5) document.querySelector("#music_audio").currentTime = 0;
            else{
                now_idx = now_idx == 0 ? 0 : now_idx - 1;
                App.save("now_queue",now_idx);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                document.querySelector("#music_audio").currentTime = 0;
                this.musicPlay();
            }
        }
    }

    musicNext(){
        let now_idx = JSON.parse(App.load("now_queue")),max_idx = JSON.parse(App.load("max_queue"));
        let music_idx = JSON.parse(App.load("queue_list"));
        let music = JSON.parse(App.load("music_list"))[music_idx[now_idx]];
        if(document.querySelector("#music_audio").getAttribute("src") == "music/"+music['url']){
            if(JSON.parse(App.load("repeat_status")) == 2) now_idx = now_idx == max_idx ? 0 : now_idx + 1;
            else now_idx = now_idx == max_idx ? max_idx : now_idx + 1;
            App.save("now_queue",now_idx);
            document.querySelector("#music_play_start").setAttribute("data-id",1);
            this.musicPlay();
        }
    }

    MusicRepeat(){
        switch(JSON.parse(App.load("repeat_status"))){
            case 1 : App.save("repeat_status",2); document.querySelector("#music_play_repeat p").innerText = "대기열 반복"; break;
            case 2 : App.save("repeat_status",0); document.querySelector("#music_play_repeat p").innerText = "반복안함"; break;
            default : App.save("repeat_status",1); document.querySelector("#music_play_repeat p").innerText = "노래반복"; break;
        }
    }

    open_musicText(){
        if(document.querySelector("#music_play_text_area").classList.contains("open")){
            document.querySelector("#music_play_text_area").classList.remove("open");
            document.querySelector("#music_play_text_open_icon").classList.remove("open");
        }else{
            document.querySelector("#music_play_text_area").classList.add("open");
            document.querySelector("#music_play_text_open_icon").classList.add("open");
        }
    }

    musicPlay(){
        if(Number(document.querySelector("#music_play_start").getAttribute("data-id"))){
            this.notuserover = 1;
            let now_num = JSON.parse(App.load("now_queue")) !== false ? JSON.parse(App.load("now_queue")) : 0;
            let music_idx = JSON.parse(App.load("queue_list"));
            let music = JSON.parse(App.load("music_list"))[music_idx[now_num]];
            if(music_idx){
                if(document.querySelector("#music_audio").getAttribute("src") !== "music/"+music['url']){
                    document.querySelector("#music_audio").setAttribute("src","music/"+music['url']);
                    document.querySelector("#music_audio").onloadeddata = ()=>{
                        document.querySelector("#music_audio").play();
                        document.querySelector("#music_play_cover").innerHTML = `<img src='image/${music['albumImage']}'>`
                        document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-pause pause"></i>`;
                        document.querySelector("#music_play_title").innerHTML = `${music['name']}`;
                        document.querySelector("#music_play_artist").innerHTML = `${music['artist']}`;
                        document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
                        document.querySelector("#music_play_start").setAttribute("data-id",0);
                        document.querySelector("#music_prograss_bar").setAttribute("max",music['duration']);
                        if(App.Login){
                            this.recentAdd(music_idx[now_num]);
                            this.RecentSet();
                        }
                        this.musiclyrics();
                        requestAnimationFrame(()=>{this.frame();});
                        this.musicReset = 0;
                    }
                }else{
                    document.querySelector("#music_audio").play();
                    document.querySelector("#music_play_cover").innerHTML = `<img src='image/${music['albumImage']}'>`
                    document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-pause pause"></i>`;
                    document.querySelector("#music_play_title").innerHTML = `${music['name']}`;
                    document.querySelector("#music_play_artist").innerHTML = `${music['artist']}`;
                    document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
                    document.querySelector("#music_play_start").setAttribute("data-id",0);
                    this.musiclyrics();
                    requestAnimationFrame(()=>{this.frame();});
                    this.musicReset = 0;
                }
            }
        }else{
            document.querySelector("#music_audio").volume =document.querySelector("#music_play_volum").value / 100;
            document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-play play"></i>`;
            document.querySelector("#music_audio").pause();
            document.querySelector("#music_play_start").setAttribute("data-id",1);
        }
    }

    recommen(){
        let playlist = JSON.parse(App.load("play_list")),musicList = JSON.parse(App.load("queue_list")),playNumlist = [],playNum_And_lastlist = [];
        let lastmusic = musicList[musicList.length - 1],lasthavelistNum = 0,check = 0,checkNum = 0,max,maxNum,recommen_list = [];
        if(JSON.parse(App.load("recommen_list")) == false) recommen_list = JSON.parse(App.load("recommen_list"));
        if(playlist !== false){
            playlist.forEach((item)=>{
                check = 0;
                item['list'].forEach(i=>{
                    check = parseInt(i) == lastmusic ? true : check;
                    if(playNumlist.findIndex(value => i == value) == -1 && i !== lastmusic.toString()) playNumlist.push(i);
                });
                if(check) lasthavelistNum++;
            });
            if(lasthavelistNum > 0){
                playNumlist.forEach(value =>{
                    checkNum = 0;
                    playlist.forEach(item =>{
                        check = (item['list'].findIndex(v => lastmusic.toString() == v) !== -1 && item['list'].findIndex(v => value == v) !== -1);
                        if(check) checkNum++;
                    });
                    playNum_And_lastlist.push(checkNum);
                });
                playNum_And_lastlist.forEach((item,idx) =>{
                    let support = (item/playlist.length),trust = (item/lasthavelistNum);
                    let v = support * trust;
                    if(idx == 0){
                        max = playNumlist[idx];
                        maxNum = [v,support,trust];
                    }else if(maxNum[0] < v){
                        max = playNumlist[idx];
                        maxNum = [v,support,trust];
                    }
                });
                
                musicList.push(parseInt(max));
                let max_queue = JSON.parse(App.load("max_queue")) + 1;
                recommen_list.push([max_queue,maxNum]);
                App.save("recommen_list",recommen_list);
                App.save("max_queue",max_queue);
                App.save("now_queue",max_queue);
                App.save("queue_list",musicList);
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                this.PageLoad();
                this.musicPlay();
            }
        }
    }

    RightMenuMake(item,e){
        let menu = document.createElement("div");
        menu.id = "RightMenu";
        menu.classList.add("RightMenu");
        menu.style.top = e.pageY+"px";
        menu.style.left = e.pageX+"px";
        menu.style.zIndex = 100000000000000;
        document.querySelector("body").appendChild(menu);
        document.querySelector("#RightMenu").innerHTML = item;
    }

    frame(){
        this.Q.QueueNowMusic();
        let now_time = document.querySelector("#music_audio").currentTime,Atime = document.querySelector("#music_audio").duration;
        document.querySelector("#music_play_all").innerText = this.Q.changeTime(document.querySelector("#music_audio").duration);
        document.querySelector("#music_play_now").innerText = this.Q.changeTime(now_time);
        this.Q.lyricsTime();
        document.querySelector("#music_prograss_bar").value = now_time;
        // 비회원
        if(now_time >= 60 && App.Login == false && this.notuserover){
            document.querySelector("#music_audio").pause();
            let now_queue = JSON.parse(App.load("now_queue")),max_queue = JSON.parse(App.load("max_queue"));
            alert("비회원은 1분 미리듣기만 가능합니다!");
            if(max_queue == now_queue && JSON.parse(App.load("repeat_status")) == 0){
                this.notuserover = 0;
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                document.querySelector("#music_play_start").innerHTML = `<i class="fa fa-play play"></i>`;
            }
            else if(JSON.parse(App.load("repeat_status") == 1)){
                document.querySelector("#music_audio").currentTime = 0;
                document.querySelector("#music_audio").play();
            }
            else{
                document.querySelector("#music_audio").currentTime = 0;
                now_queue = now_queue >= max_queue ? 0 : now_queue + 1;
                App.save("now_queue",now_queue);
                this.musicReset = 1;
                document.querySelector("#music_play_start").setAttribute("data-id",1);
                this.musicPlay();
            }
        }
        // 노래 재생다함
        if((now_time >= Atime && !this.musicReset)) {
            let now_queue = JSON.parse(App.load("now_queue")),max_queue = JSON.parse(App.load("max_queue"));
            if(max_queue == now_queue && JSON.parse(App.load("repeat_status")) == 0){
                this.recommen();
                return false;
            }
            else if(JSON.parse(App.load("repeat_status")) !== 1) now_queue = now_queue >= max_queue ? 0 : now_queue + 1;
            App.save("now_queue",now_queue);
            this.musicReset = 1;
            document.querySelector("#music_play_start").setAttribute("data-id",1);
            this.musicPlay();
        }
        requestAnimationFrame(()=>{
            this.frame();
        });
    }

    RecentSet(){
        if(document.querySelector("#play_now_list_area")){
            let recent_list = JSON.parse(App.load("recent_list"));
            document.querySelector("#play_now_list_area").innerHTML = "";
            recent_list.forEach((item, idx)=>{
                this.recentBoxMade(item,idx);
            });
        }
    }

    recentBoxMade(value,idx){
        let music_list =JSON.parse( App.load("music_list"));
        let box = document.createElement("div");
        box.classList.add("play_now_area_box");
        box.innerHTML += `
        <img src="/image/${music_list[value]['albumImage']}" alt="play_now_box_cover" class="play_now_box_cover">
        <div class="play_now_box_info">
            <p class="play_now_title">${music_list[value]['name']}</p>
            <p class="play_now_artist">${music_list[value]['artist']}</p>
        </div>
        <div class="play_now_box_hover" id = "playNow_${value}" data-id="${idx}">
            <button class="play_now_box_play" id = "playNow_${value}" data-id="${value}">
                <i class="fa fa-play play play_now_box_play_icon"  data-id="${value}"></i>
            </button>
        </div>
        `;
        document.querySelector("#play_now_list_area").prepend(box);
    }

    recentAdd(id){
        let recent = [];
        if(App.load("recent_list") !== false) recent = JSON.parse(App.load("recent_list"));
        recent.push(id);
        let start = recent.length > 5 ? recent.length - 5 : 0;
        let value = recent.slice(start);
        App.save("recent_list",value);
    }

    musiclyrics(){
        let now_idx = JSON.parse(App.load("now_queue")),music_list = JSON.parse(App.load("music_list")),queue_list = JSON.parse(App.load("queue_list"));
        let now_lyrics = music_list[queue_list[now_idx]],textArea = document.querySelector("#music_play_text_area");
        textArea.innerHTML = `<h2>${now_lyrics['name']} <br> <span>${now_lyrics['artist']}</span></h2>`;
        if(now_lyrics['lyrics'] == null){
            textArea.innerHTML += `<p>가사가 없습니다.</p>`;
        }else{
            fetch("/lyrics/"+now_lyrics['lyrics'])
                .then(v => v.text())
                .then(v =>{
                    let reg = /[0-9]+\n(?<time>.+)\n(?<lyrics>.+)/;
                    while(reg.test(v)){
                        let stime = 0,etime = 0;
                        let timeReg = /(?<hour>[0-9]{2}):(?<min>[0-9]{2}):(?<sec>[0-9]{2}),(?<ms>[0-9]+)\s-->\s(?<endhour>[0-9]{2}):(?<endmin>[0-9]{2}):(?<endsec>[0-9]{2}),(?<endms>[0-9]+)/;
                        let time = reg.exec(v).groups['time'],ly = reg.exec(v).groups['lyrics'];
                        if(timeReg.test(time)){
                            let timeG = timeReg.exec(time).groups;
                            stime = (timeG['hour'] * 3600) + (timeG['min'] * 60) + Number(timeG['sec']) + (timeG['ms'] / 1000);
                            etime = (timeG['endhour'] * 3600) + (timeG['endmin'] * 60) + Number(timeG['endsec']) + (timeG['endms'] / 1000);
                            etime = etime == 0 ? document.querySelector("#music_audio").duration : etime;
                        }
                        textArea.innerHTML += `<p data-stime = '${stime}' data-etime = '${etime}'>${ly}</p>`;
                        v = v.substr(v.indexOf(ly) + ly.length);
                    }
                });
        }
    }

    createMusic(item){
        let musiclist= `
        <div class="music_list_area_music">
            <div class ="music_list_cover_box"><img src="image/${item['albumImage']}" alt="music_cover" class="music_list_cover"></div>
            <div class="music_list_info">
                <p class="music_list_title">${item['name']}</p>
                <p class="music_list_artist">${item['artist']}</p>
            </div>
            <div class="music_list_area_music_hover" id="idx_${item['idx']}">
                <button class="music_list_button" data-id = "${item['idx']}"><i class="fa fa-play play" data-id = "${item['idx']}"></i></button>
            </div>
        </div>
        `;
        return musiclist;
    }
}

class queue{

    createMusic(){
        document.querySelector("#playlist_music").innerHTML = "";
        let list = JSON.parse(App.load("music_list"));
        let times = 0;
        let queue = JSON.parse(App.load("queue_list"));
        let recommen = JSON.parse(App.load("recommen_list"));
        let recommen_i = 0;
        if(queue !== false){
            queue.forEach(async (item,idx) =>{
                let recommen_s = false;
                if(recommen.length > 0 && recommen[recommen_i][0] == idx){
                    recommen_s = recommen[recommen_i];
                    recommen_i++;
                }
                this.createMusicBox(list,item,idx,recommen_s);
            });
        }
    }

    createMusicBox(list,item,idx,recommen){
        let music = ``;
        if(recommen == false){
            music=`<div class="playlist_music" id="idx_${item}" data-num="${idx}">
                <img src="image/${list[item]['albumImage']}" alt="cover">
                <div class="playlist_music_info">
                    <p class="playlist_music_title">${list[item]['name']}</p>
                    <p class="playlist_music_artist">${list[item]['artist']}</p>
                    <p class="playlist_music_time">${this.changeTime(list[item]['duration'])}</p>
                </div>
                <div class="playlist_music_num">#${idx + 1}</div>
            </div>`;
        }else{
            music=`<div class="playlist_music" id="idx_${item}" data-num="${idx}" title="지지도:${recommen[1][1]} 신뢰도:${recommen[1][2]}">
                <img src="image/${list[item]['albumImage']}" alt="cover">
                <div class="playlist_music_info">
                    <p class="playlist_music_title">${list[item]['name']}</p>
                    <p class="playlist_music_artist">${list[item]['artist']}</p>
                    <p class="playlist_music_time">${this.changeTime(list[item]['duration'])}</p>
                </div>
                <div class="playlist_music_num">#${idx + 1}</div>
            </div>`;
        }
        document.querySelector("#playlist_music").innerHTML += music;
    }

    lyricsTime(){
        document.querySelectorAll("#music_play_text_area p").forEach(item =>{
           let now_time = document.querySelector("#music_audio").currentTime;
           let lyrics_st = item.getAttribute("data-stime"),lyrics_et = item.getAttribute("data-etime");
           if(now_time >= lyrics_st && now_time <=lyrics_et){
            if(!item.classList.contains("now_lyrics")) item.classList.add("now_lyrics");
           }else{
            if(item.classList.contains("now_lyrics")) item.classList.remove("now_lyrics");
           }
           if(document.querySelector(".now_lyrics")) document.querySelector("#music_play_text_area").scrollTop = document.querySelector(".now_lyrics").offsetTop - (parseInt($("#music_play_text_area").css("height")) / 2);
        });
    }

    QueueNowMusic(){
        let now_music = JSON.parse(App.load("now_queue"));
        let music_list = JSON.parse(App.load("music_list"));
        let queue_list = JSON.parse(App.load("queue_list"));
        let now_idx = music_list[queue_list[now_music]]['idx'];
        queue_list.forEach((item,idx)=>{
            if(idx !== now_music && document.querySelector("#idx_"+item) && document.querySelector("#idx_"+item).classList.contains("now")) document.querySelector("#idx_"+item).classList.remove("now");
        });
        if(document.querySelector("#idx_"+now_idx) && !document.querySelector("#idx_"+now_idx).classList.contains("now")) document.querySelector("#idx_"+now_idx).classList.add("now");
    }

    changeTime(time){
        let m = "0" + Math.floor(time % 3600 / 60);
        m = m.substring(m.length - 2, m.length);
        let s = "0" + Math.floor(time % 60);
        s = s.substring(s.length - 2, s.length);
        return `${m}:${s}`;
    }
}

class Link{
    constructor(){
        this.LinkEvent();
        this.app = new App();
    }

    LinkEvent(){
        window.addEventListener("click",(e)=>{
            if(e.target.classList.contains("link")){
                let href = e.target.getAttribute("data-href");
                history.pushState({data:""},null,href);
                fetch("/"+href)
                    .then(v => v.text())
                    .then(v => {
                        let reg = /<!--\scontent-->[^]+<div\sid="content">([^]*)<\/div>[^]+<!--\sendcontent-->/;
                        if(reg.exec(v)){
                            let content = reg.exec(v)[1];
                            document.querySelector("#content").innerHTML = content;
                            let loading = document.createElement("div");
                            loading.id = "Loading";
                            loading.innerHTML = `<div class="loading_circle"></div>`;
                            document.querySelector("body").appendChild(loading);
                            setTimeout(()=>{
                                document.querySelector("body").removeChild(document.querySelector("#Loading"));
                                this.app.PageLoad();
                            },500);
                        }
                    });
            }
        });
    }
}

window.onload = ()=>{
    let link = new Link();
}