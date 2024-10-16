console.log("js");
let currentSong = new Audio();
let songs = [];
let currfolder;

// Convert seconds to minutes:seconds format
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

// Fetch songs from a specific folder
async function getSongs(folder) {
  currfolder = folder;
  let response = await fetch(`http://127.0.0.1:5500/songs/${folder}/`);
  let text = await response.text();

  let div = document.createElement("div");
  div.innerHTML = text;
  let songElements = div.getElementsByTagName("a");
  let songList = [];

  for (let i = 0; i < songElements.length; i++) {
    let song = songElements[i];
    if (song.href.endsWith(".mp3")) {
      let songName = song.href.split(`/songs/${folder}/`)[1];
      songList.push(songName.replaceAll("%20", " "));
    }
  }
  return songList;
}

// Display all available albums on the page
async function displayAlbums() {
  let response = await fetch("http://127.0.0.1:5500/songs/");
  let text = await response.text();

  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");

  for (let anchor of anchors) {
    if (anchor.href.includes("/songs/")) {
      let folder = anchor.href.split("/songs/")[1];
      let metadataResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
      let metadata = await metadataResponse.json();

      cardContainer.innerHTML += `
        <div class="card" data-folder="${folder}">
          <div class="play">
            <img src="images/triangle.png" alt="" style="width: 12px" />
          </div>
          <img src="/songs/${folder}/cover.jpg" alt="" class="cardimg" />
          <h3>${metadata.title}</h3>
          <p>${metadata.description}</p>
        </div>`;
    }
  }
}

// Play a specific track
function playMusic(track) {
  currentSong.pause();
  currentSong.src = `/songs/${currfolder}/${track}`;
  currentSong.load();
  currentSong.play();
  document.getElementById("play").setAttribute("src", "images/pause.svg");

  document.querySelector(".songinfo").textContent = track.substring(0, track.length - 4);
  document.querySelector(".songtime").textContent = "00:00/00:00";
  document.querySelector(".volume").style.display = "flex";
  document.querySelector(".playbar").style.display="flex";
}

// Toggle between play and pause
function togglePlayPause() {
  let playButton = document.getElementById("play");
  if (currentSong.paused) {
    currentSong.play();
    playButton.setAttribute("src", "images/pause.svg");
  } else {
    currentSong.pause();
    playButton.setAttribute("src", "images/play.svg");
  }
}

// Main function to initialize the app
async function main() {
  await displayAlbums();
  let songListElement = document.querySelector(".songlist ul");
  songListElement.innerHTML = "";

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      songs = await getSongs(card.dataset.folder);
      console.log(songs);
      playMusic(songs[0]);

      // Display songs in the list
      songListElement.innerHTML = songs.map((song, index) => `
        <li>
          <img src="images/music.svg" alt="" class="invert" />
          <div class="info">
            <div>${song}</div>
            <div>Artist ${index + 1}</div>
          </div>
          <div class="playnow">
            <span>Play now</span>
            <img src="images/playbutton.png" alt="" class="invert" width="20px" style="padding-top: 3px;">
          </div>
        </li>
      `).join('');

      // Attach event listeners to each song
      document.querySelectorAll(".songlist li").forEach((item) => {
        item.addEventListener("click", () => {
          playMusic(item.querySelector(".info").firstElementChild.textContent);
        });
      });
    });
  });

  document.getElementById("play").addEventListener("click", togglePlayPause);

  // Update the seekbar and song time
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").textContent = `
      ${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}
    `;
    document.querySelector(".circle").style.left = 
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Allow seeking through the seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = e.offsetX / e.target.getBoundingClientRect().width;
    currentSong.currentTime = percent * currentSong.duration;
  });

  // Hamburger menu functionality
  document.querySelector(".hamburger").addEventListener("click", () => {
    let leftBox = document.querySelector(".left");
    if (leftBox.style.left === "0px") {
      leftBox.style.left = "-150%";
      document.querySelector(".playlist").style.height = "90%";
    } else {
      leftBox.style.left = "0px";
      leftBox.style.zIndex = "100";
      leftBox.style.backgroundColor = "black";
      leftBox.style.height = "97vh";
      leftBox.style.width = window.innerWidth <= 550 ? "100%" : "50%";
      document.querySelector(".library").style.height = "66vh";
    }
  });

  // Close left menu
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-150%";
  });

  // Add event listeners for previous and next song buttons
  document.querySelector("#previous").addEventListener("click", () => {
    let currentIndex = songs.indexOf(currentSong.src.split(`/songs/${currfolder}/`)[1].replaceAll("%20", " "));
    if (currentIndex > 0) {
      playMusic(songs[currentIndex - 1]);
    }
  });

  document.querySelector("#next").addEventListener("click", () => {
    let currentIndex = songs.indexOf(currentSong.src.split(`/songs/${currfolder}/`)[1].replaceAll("%20", " "));
    if (currentIndex < songs.length - 1) {
      playMusic(songs[currentIndex + 1]);
    }
  });

  // Volume control
  document.querySelector(".range input").addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
  });
  //Add event listener to volume
  document.querySelector(".volume>img").addEventListener("click",e=>{
    if(e.target.src.includes("images/volume.svg"))
    {
       e.target.setAttribute("src","images/mute.svg");
       currentSong.volume=0;
       document.querySelector(".range input").value=0;

    }
    else{
      e.target.setAttribute("src","images/volume.svg");
      currentSong.volume=0.1;
      document.querySelector(".range input").value=10;
    }
  })
}

main();
