/**
 *  @file lastfmapi.js
 *  @brief Demonstration of using LastFM API for IceCast server. 
 *  Project home: https://github.com/vajayattila/lastFMApi.git
 *	@author Vajay Attila (vajay.attila@gmail.com)
 *  @copyright MIT License (MIT)
 *  @date 2020.02.22-2020.02.24
 *  @version 1.0.0.1
 */

lastFMApi={
    apiId: "9685d02a4393c41bb141465ae1ab9855",
    urlBase: "https://vps.vyata.hu:9011",
    songInfoRefreshRate: 8000,
    sourceIndex: 0,
    lastTrack: null,
    init: function(){
        var xmlhttp = new XMLHttpRequest();
        setInterval(function(){
            xmlhttp.open("GET", lastFMApi.urlBase.concat("/", "status-json.xsl"), true);
            xmlhttp.send();  
            xmlhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var response = JSON.parse(this.responseText);
                    if(Array.isArray(response.icestats.source)){
                        title=response.icestats.source[lastFMApi.sourceIndex].title;
                    }else{
                        title=response.icestats.source.title;                
                    }                    
                    if(title!=lastFMApi.lastTrack){
                        lastFMApi.lastTrack=title;
                        if(title.search("-")!=-1){
                            var artist=title.substring(0,title.search("-")).trim();
                            var track=title.substring(title.search("-")+1).trim();
                            lastFMApi.trackGetInfo(artist, track);
                        }else{
                            var tracks=document.getElementById("tracks");  
                            img.src="./img/blank-cover.jpg";
                            album.style.display="none";
                            release.style.display="none"; 
                            tracks.style.display="none";                                
                        }
                    }
                }
            }
        },lastFMApi.songInfoRefreshRate);  
    },
    trackGetInfo: function(artist, track){
        var album=document.getElementById("album");        
        var release=document.getElementById("release");     
        var command=
            "https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key="+
            lastFMApi.apiId+
            "&artist="+artist+
            "&track="+track+
            "&format=json";
        //debug.innerHTML=command;    
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", command, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var img=document.getElementById("img");
                //debug.innerHTML=this.responseText;
                var jsondata = JSON.parse(this.responseText);
                img.src="./img/blank-cover.jpg";
                album.style.display="none";
                release.style.display="none";                
                if(
                    jsondata["track"]!==undefined &&
                    jsondata["track"]["album"]!==undefined &&
                    jsondata["track"]["album"]["title"]!==undefined
                ){
                    var albumtitle=jsondata["track"]["album"]["title"];
                    album.innerHTML=albumtitle;
                    var imgsrc=jsondata["track"]["album"]["image"][3]["#text"];
                    img.src=imgsrc;
                    var mbid=jsondata["track"]["album"]["mbid"];
                    lastFMApi.albumGetInfo(mbid, track, artist, albumtitle);
                    if(imgsrc===undefined || imgsrc==="" || imgsrc===null){
                        img.src="./img/blank-cover.jpg";                        
                    }
                    album.style.display="block";                                   
                }
            }    
        }
    },
    albumGetInfo: function(mbid, track, artist, albumtitle){
        var release=document.getElementById("release");    
        var tracks=document.getElementById("tracks");                 
        var debug=document.getElementById("debug");           
        var command="";
        if(mbid!="" && mbid!=undefined){
            command=
                "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key="+
                lastFMApi.apiId+"&mbid="+mbid+"&format=json";
        }else{
            command=
                "https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key="+
                lastFMApi.apiId+"&artist="+artist+"&album="+albumtitle+"&format=json";
        }
        var xmlhttp = new XMLHttpRequest();
        //debug.innerHTML=command;        
        xmlhttp.open("GET", command, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //debug.innerHTML=this.responseText;
                var jsondata = JSON.parse(this.responseText);
                if(
                    jsondata["album"]!==undefined &&
                    jsondata["album"]["releasedate"]!==undefined
                ){
                    release.innerHTML=jsondata["album"]["releasedate"];
                    release.style.display="block";
                }else{
                    release.style.display="none";
                }    
                if(
                    jsondata["album"]!==undefined &&
                    jsondata["album"]["tracks"]!==undefined 
                ){
                    tracks.innerHTML="";
                    for (let i = 0; i < jsondata["album"]["tracks"]["track"].length; i++) {
                        var name=jsondata["album"]["tracks"]["track"][i]["name"];
                        if(name.toUpperCase()==track.toUpperCase()){
                            tracks.innerHTML=tracks.innerHTML+'<div class="activetrack">'+name+"</div>";
                        }else{
                            tracks.innerHTML=tracks.innerHTML+'<div class="track">'+name+"</div>";
                        }
                    }
                    tracks.style.display="block";
                }else{
                    tracks.style.display="none";                   
                }        
            }
        }
    }

}