let shareImageButton = document.querySelector("#share-image-button");
let createPostArea = document.querySelector("#create-post");
let closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
let sharedMomentsArea = document.querySelector("#shared-moments");

const openCreatePostModal = () => {
  createPostArea.style.display = "block";
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choiceResult) {
      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });
    deferredPrompt = null;
  }
  //if we remove service worker
  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then((registrations) => {
  //     for (let i = 0; i < registrations.length; i++) {
  //       registrations[i].unregister();
  //     }
  //   });
  // }
};
const closeCreatePostModal = () => {
  createPostArea.style.display = "none";
};
// cache will be saved on user request
// const onSaveButtonClicked = (e) => {
//   if ("caches" in window) {
//     caches.open("user-requested").then((cache) => {
//       cache.addAll(["https://httpbin.org/get", "/src/images/sf-boat.jpg"]);
//     });
//   }
// };

const clearCards = () => {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
};

shareImageButton.addEventListener("click", openCreatePostModal);
closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

const createCard = (data) => {
  let cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  let cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  let cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.location + " Trip";
  cardTitle.appendChild(cardTitleTextElement);
  let cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.title;
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
  //button
  // let cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSupportingText.appendChild(cardSaveButton);
  // cardSaveButton.addEventListener("click", onSaveButtonClicked);
};
const updateUI = (data) => {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
};
let url = "https://pwagram-9c659-default-rtdb.firebaseio.com/posts.json";
let networkDataReceived = false;

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log("From web", data);
    let dataArray = [];
    for (let key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

// get data from cache
// if ("caches" in window) {
//   caches
//     .match(url)
//     .then(function (response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function (data) {
//       console.log("From cache", data);
//       if (!networkDataReceived) {
//         let dataArray = [];
//         for (let key in data) {
//           dataArray.push(data[key]);
//         }
//         updateUI(dataArray);
//       }
//     });
// }

//get data from indexDB
if ("indexedDB" in window) {
  readAllData("posts").then((data) => {
    if (!networkDataReceived) {
      console.log("from indexDB", data);
      updateUI(data);
    }
  });
}
