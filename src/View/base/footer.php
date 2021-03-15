<!-- music_play -->
<div id="music_play">
            <audio src="" id="music_audio"></audio>
            <div id="music_play_cover">

            </div>
            <div id="music_play_center">
                <div id="music_play_title">선택된 노래가 없습니다.</div>
                <div id="music_play_artist"></div>
                <input type="range" id="music_prograss_bar" min="0" step="0.1" value="0">
                <div id="music_play_time">
                    <div id="music_play_now">00:00</div>
                    <div id="music_play_all">00:00</div>
                </div>
            </div>
            <div id="music_play_button_box">
                <button class="music_play_button" id="music_play_last"><i class="fa fa-backward prev"></i></button>
                <button class="music_play_button" id="music_play_start" data-id="1"><i class="fa fa-play play"></i></button>
                <button class="music_play_button" id="music_play_next"><i class="fa fa-forward next"></i></button>
            </div>
            <div id="music_play_volum_box">
                <label for="music_play_volum"><i class="fa fa-volume-down"></i></label>
                <input type="range" id="music_play_volum" min="0" max="100" value="50">
                <p id="music_play_volum_value">50%</p>
            </div>
            <div id="music_play_text">
                <button id="music_play_text_open"><i class="fa fa-cc cc" id="music_play_text_open_icon"></i></button>
                <div id="music_play_text_area">
                </div>
                <button class="music_play_button" id="music_play_repeat">
                    <i class="fa fa-repeat state music_play_icon"></i>
                    <p>반복안함</p>
                </button>
            </div>
        </div>