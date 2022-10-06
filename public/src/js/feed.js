let shareImageButton = document.querySelector("#share-image-button");
let createPostArea = document.querySelector("#create-post");
let closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
let sharedMomentsArea = document.querySelector("#shared-moments");
let form = document.querySelector("form");
let titleInput = document.getElementById("title");
let locationInput = document.getElementById("location");

const openCreatePostModal = () => {
  createPostArea.style.transform = "translateY(0)";
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
  createPostArea.style.transform = "translateY(100vh)";
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
//directly send data to the backend
const sendData = () => {
  console.log("sending data directly");
  fetch("https://pwagram-9c659-default-rtdb.firebaseio.com/posts.json", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image:
        "https://firebasestorage.googleapis.com/v0/b/pwagram-9c659.appspot.com/o/sf-boat.jpg?alt=media&token=0594223f-ef76-4ca1-9e0b-5fdcd545249d",
    }),
  }).then((res) => {
    console.log("Sent Data", res);
    updateUI();
  });
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("enter valid data");
    return;
  }
  closeCreatePostModal();
  //save request into indexDB for syncing
  if ("serviceWorker" in navigator || "SyncManager" in window) {           
    navigator.serviceWorker.ready.then((sw) => {
      let post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
      };
      writeData("sync-posts", post)
        .then(() => {
          console.log("sw", sw);
          return sw.sync.register("sync-new-posts");
        })
        .then(() => {
          let snackbarContainer = document.querySelector("#confirmation-toast");
          let data = { message: "Your post was saved for syncing" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
  //if browser doesn't support sync manager
  else {
    sendData();
  }
});
