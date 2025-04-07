// const url = "http://192.168.68.116:5000";
// const url = "http://127.0.0.1:5000";
const url = "https://api.arcdem.site";

// const url = "https://roadtrack-test.onrender.com";

let selectedGroup;
let openedId = 0;
let openedMark = 0;
let openedMarkId = 0;

let currentPopup = null; // Track the currently open popup
let firstPopupOpened = false; // Ensure only the first marker opens a popup
let displayAssessState = false;
let displaySubgrpState = false;
let currSubgrpIDPopup = 0;
let currSubgrpParentIDPopup = 0;
let markerArr = [];
let assessGroup = {};
let markers = {};
const main = document.getElementById("main");
const sideGIS = document.querySelector(".sideGIS");
// -------------------------------------------------------------------------

document.addEventListener("click", (event) => {
  const panel = document.querySelector(".groupsList"); // Target div
  const selected = document.querySelector(".groupsList h6.selected"); // Target div

  if (!panel || !selected) return;

  if (panel.contains(event.target) && !selected.contains(event.target)) {
    closeGroupDetails(openedId); // Example: Close the div
  }
});

const yellowMark = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redMark = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png", // you can change to green, yellow, etc.
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const blueMark = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let map = L.map("map", {
  center: [12.8797, 121.774], // Center of the Philippines
  zoom: 6, // Default zoom level
  maxBounds: [
    [3.5, 116.0], // Southwest corner (lower-left)
    [23.5, 127.0], // Northeast corner (upper-right)
  ],
  maxBoundsViscosity: 1.0, // Prevents dragging outside bounds
  minZoom: 6, // Prevents zooming out too much
});

// Cursor Coordinates Display
var coordinates = L.control({ position: "bottomright" });

coordinates.onAdd = function () {
  var div = L.DomUtil.create("div", "coordinate-display");
  div.style.padding = "5px";
  div.style.background = "rgba(255, 255, 255, 0.8)";
  div.style.borderRadius = "5px";
  div.innerHTML = "Lat: -, Lng: -";
  return div;
};

coordinates.addTo(map);

map.on("mousemove", function (e) {
  document.querySelector(
    ".coordinate-display"
  ).innerHTML = `Lat: ${e.latlng.lat.toFixed(5)}, Lng: ${e.latlng.lng.toFixed(
    5
  )}`;
});

// Base Layers
let osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

let googleStreets = L.tileLayer(
  "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }
);

googleHybrid = L.tileLayer(
  "http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  }
);

// Layer Control
let baseLayers = {
  OpenStreetMap: osm,
  "Satellite View": googleHybrid,
  "Google Street": googleStreets,
};

// Add Layer Control Button
L.control.layers(baseLayers, null, { position: "bottomright" }).addTo(map);

L.control.zoom({ position: "bottomright" }).addTo(map);

// ------------------------------------------------------------------------

const fetchGroup = async (param, relation = "") => {
  try {
    let link = `${url}/group/${param}`;

    if (relation === "") {
      link = `${url}/group/${param}`;
    } else {
      link = `${url}/group/${param}/${relation}`;
    }

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched group:", data);
    return data;
  } catch (error) {
    console.error("Error fetching group:", error);
    return [];
  }
};

const fetchAncestors = async (ID) => {
  try {
    let link = `${url}/assessment/${ID}/address`;

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched ancestor:", data);
    return data;
  } catch (error) {
    console.error("Error fetching ancestor:", error);
    return [];
  }
};

const fetchCracks = async () => {
  try {
    let link = `${url}/cracks`;

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched crack:", data);
    return data;
  } catch (error) {
    console.error("Error fetching crack:", error);
    return [];
  }
};

const fetchAssessments = async (assessID, cracks = false) => {
  try {
    let link;
    if (cracks) link = `${url}/assessment/${assessID}/cracks`;
    else link = `${url}/assessments`;

    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched assessment:", data);
    return data;
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return [];
  }
};

const groupSorting = async (groupID, selected = "") => {
  if (!selected) {
    selectedGroup = document.getElementById("sortGroup").value;
    // closeSubgrpDetails(
    //   currSubgrpIDPopup,
    //   currSubgrpParentIDPopup,
    //   (all = true)
    // );

    displayGroupLevels();
    return;
  }
  openedId = 0;
  selectedGroup = selected;
  console.log("okohdjkhjkhfsdf", groupID);
  displayGroupLevel(selectedGroup, groupID);
};

const init = async () => {
  homePanel();
  selectedGroup = document.getElementById("sortGroup").value;
  displayGroupLevels();
  displayMarkers();
};

const displayMarkers = async () => {
  const assessments = await fetchAssessments();

  assessments.forEach((assessment) => {
    let lat = (assessment.start_coor[0] + assessment.end_coor[0]) / 2;
    let lng = (assessment.start_coor[1] + assessment.end_coor[1]) / 2;

    let marker = L.marker([lat, lng]).addTo(map).bindPopup("Opened Assessment");

    markers[`assID-${assessment.id}`] = marker;
    marker.on("click", (e) => {
      e.originalEvent.stopPropagation();
      displayMarkersDetails(assessment.id, lat, lng);
      marker.openPopup();
    });
  });
};

const displayMarkersDetails = async (ID, lat, lng) => {
  if (ID === openedMarkId) return;
  openedMarkId = ID;
  markers[`assID-${ID}`].openPopup();
  const detailsElement = document.querySelector(".details");
  if (detailsElement) detailsElement.remove();

  document.querySelectorAll(".groupsList--content h6").forEach((assess) => {
    assess.classList.remove("selected");
  });

  openedAss = document.getElementById(`assess-${ID}`);
  if (openedAss) openedAss.classList.add("selected");

  const assessCracks = await fetchAssessments(ID, true);
  main.insertAdjacentHTML(
    "afterend",
    `<aside class="assessDetails details" id="assessDetails">
          <div
            id="details__toggle"
            class="details__toggle z-[-1] sm:hidden text-center flex items-center justify-center text-5xl leading-none rounded-full h-14 w-16 pb-2 pl-5 bg-light absolute top-[50%] translate-y-[-50%] right-0 translate-x-[65%] duration-300 ease-in-out"
          >
            &lsaquo;
          </div>

          <div>
            <div class="top flex justify-between z-50 w-full items-center top-0 left-0 allindent pr-8 bg-dark text-light gap-5">
              <h5 class="inline" id="coordinates">
                <span>
                  ${Math.abs(lat).toFixed(6)}&deg; ${lat >= 0 ? "N" : "S"},
                </span>
                <span>
                  ${Math.abs(lng).toFixed(6)}&deg; ${lng >= 0 ? "E" : "W"}
                </span>
              </h5>
              <h2 class="opacity-0">.</h2>
              <h5 class="inline">Road: 5m</h5>
            </div>
          </div>

          <span class="yellow-part bg-primary flex justify-between items-center">
            <span class="flex gap-1 items-center py-3 overflow-x-hidden">
              <img src="/img/pin-loc.png" class="w-[15px] h-[15px] md:w-[20px] md:h-[20px] lg:w-[30px] lg:h-[30px]" alt="" />
              <span id="address" ">
               
              </span>
            </span>
            <a class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl" onclick="closeMarkerDetails(${ID})">×</a>
          </span>

          <div id="crackDetails" class="overflow-y-auto">

          </div>
        </aside>
  `
  );

  let address = document.querySelector("#address");
  const ancestors = await fetchAncestors(ID);
  console.log("ID", ancestors);

  ancestors.forEach((ancestor, index) => {
    address.insertAdjacentHTML(
      "beforeend",
      `<p class="inline capitalize">${index > 0 ? ", " : ""}${ancestor.name}</p>`
    );
  });

  document.getElementById("details__toggle").addEventListener("click", () => {
    document.querySelector(".details").classList.toggle("close");
    document.querySelector(".details__toggle").classList.toggle("scale-x-[-1]");
    document.querySelector(".details__toggle").classList.toggle("pl-5");
    document.querySelector(".details__toggle").classList.toggle("pr-5");
  });

  const toggleButton = document.getElementById("details__toggle");
  const detailsPanel = document.querySelector(".details");

  // Function to reset classes when screen reaches 'sm'
  function resetOnSm(event) {
    if (event.matches) {
      detailsPanel.classList.remove("close");
      toggleButton.classList.remove("scale-x-[-1]", "pl-5", "pr-5");
      toggleButton.classList.add("pl-5");
    }
  }
  let crackDetails = document.getElementById("crackDetails");
  let index = 0;

  const formattedDate = new Date(assessCracks.date)
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    })
    .replace(",", "");


  crackDetails.innerHTML += `<p class="crack-info py-2"><span class="font-bold">Date Asssessed: </span>${formattedDate}</p>`;
  assessCracks.cracks.forEach((crack) => {
    let solution;
    if (
      crack.crack_type == "transverse" ||
      (crack.crack_type == "longitudinal" && crack.crack_severity == "narrow")
    ) {
      solution = "Grooving and Sealing";
    } else if (
      crack.crack_type == "transverse" ||
      (crack.crack_type == "longitudinal" && crack.crack_severity == "wide")
    ) {
      solution = "Stitch Repair";
    } else {
      solution = "Reblocking";
    }
    crackDetails.innerHTML += `
    <div class="crack-info grid gap-2">
      <h3 class="font-bold">Crack ${index + 1}:</h3>
      <p class="capitalize"><span class="font-bold">Type: </span>${
        crack.crack_type
      } Crack</p>
      <p class="capitalize"><span class="font-bold">Severity: </span>${
        crack.crack_severity
      }</p>
      <p><span class="font-bold">Length: </span>${crack.crack_length}m</p>
      <p id="crack-${index}-width"</p>
      <p id="crack-${index}-affect"></p>
      <p><span class="font-bold">Recommended Solution: </span>${solution}</p>
    </div>`;

    const type = document.getElementById(`crack-${index}-width`);
    const affected = document.getElementById(`crack-${index}-affect`);

    if (crack.crack_type.toLowerCase() === "multiple") {
      affected.innerHTML = `<span class="font-bold">Affected Area: </span>${
        crack.crack_width * crack.crack_length
      }m<sup>2</sup>`;
      type.innerHTML = `<span class="font-bold">Width: </span>${crack.crack_width}m`;
    } else if (
      crack.crack_type.toLowerCase() === "longitudinal" ||
      crack.crack_type.toLowerCase() === "transverse"
    ) {
      affected.remove();
    }

    index++;
  });

  let filename = `${url}/image/${assessCracks.filename}.jpg`;
  crackDetails.innerHTML += `
  <img src="${filename}" class="object-fit p-5" />`;

  const sideGIS = document.querySelector(".sideGIS");
  sideGIS.classList.add("open");
};

const handleAssessClick = (ID, lat, lng) => {
  displayMarkersDetails(ID, lat, lng); // your original function

  const marker = markers[`assID-${ID}`];
  if (marker) {
    marker.openPopup(); // ✅ show the popup when h6 is clicked
  }
};

const resetZoom = () => {
  map.setView([12.8797, 121.774], 6); // Center of the Philippines, Zoom level 6
};

const homePanel = async (param, groupID = 0) => {
  let target = document.querySelector(".groupsPanel");
  if (target) target.remove();
  main.insertAdjacentHTML(
    "afterend",
    `
  <aside class="groupsPanel">
    <div class="groupsPanel__menu" id="groupsPanel__menu">
      <span class=""></span>
      <span class=""></span>
      <span class=""></span>
    </div>
    <div class="backdrop absolute w-full h-full top-0 left-0 z-40 sm:hidden"></div>
    <div class="groupsPanel__wrapper h-full grid grid-rows-[auto_1fr] z-10">
      <div class="groupsLabel z-50 text-light w-full top-0 right-0">
        <label class="groupsPanel--sorts h6 border-b-2 grid px-3 py-3 sm:grid-cols-[auto_auto] gap-2">
          Sort by:
          <select id="sortGroup" class="text-dark" onchange="groupSorting()">
            <option value="region" selected>Region</option>
            <option value="province">Province</option>
            <option value="city">City</option>
          </select>
        </label>
      </div>
      <div class="groupsList">
        <div id="groupNames"></div>
      </div>
    </div>
  </aside>
`
  );

  document.getElementById("groupsPanel__menu").addEventListener("click", () => {
    document.querySelector(".groupsPanel").classList.toggle("open");
    document.querySelector(".groupsPanel__wrapper").classList.toggle("open");
    document.querySelector(".backdrop").classList.toggle("z-40");
  });

  document.addEventListener("touchstart", (event) => {
    const menuButton = document.getElementById("groupsPanel__menu");
    const panel = document.querySelector(".groupsPanel");
    const wrapper = document.querySelector(".groupsPanel__wrapper");
    const backdrop = document.querySelector(".backdrop");

    // Check if the click is outside the panel and menu button
    if (
      !panel.contains(event.target) &&
      !menuButton.contains(event.target) &&
      window.innerWidth < 640 // Apply only for mobile screens (sm)
    ) {
      panel.classList.remove("open");
      wrapper.classList.remove("open");
      backdrop.classList.add("z-40");
    }
  });

  // displayGroupDetails(groupLevels[0].id);

  // if (!groupID) displayGroupDetails(groupLevels[0].id);
  // else {
  //   console.log("hioashs", !groupID);
  //   displayGroupDetails(groupID);
  // }
  resetMarkerColors();
  resetZoom();
  sideGIS.classList.remove("open");
};

const displayGroupLevels = async () => {
  const groupLevels = await fetchGroup(selectedGroup);
  const groupNames = document.getElementById("groupNames");

  groupNames.innerHTML = "";
  for (let groupLevel of groupLevels) {
    groupNames.innerHTML += `
        <h6 id="group-${groupLevel.id}" onclick="displayGroupDetails(${groupLevel.id})">${groupLevel.name}</h6>
      `;

    // const assess = await fetchGroup(groupLevel.id, "assessments");
    // const key = `groupAss-${groupLevel.id}`;
    // assessGroup[key] = assess.assessments;
    // addMarker(assessGroup[key]);
  }
};

const displayGroupDetails = async (ID) => {
  // if (ID === openedId ) return;
  const detailsElement = document.querySelector(".details");
  if (detailsElement) {
    detailsElement.remove();
  }
  // if (currSubgrpIDPopup != ID || currSubgrpIDPopup != openedId) {
  //   displayAssessState = false;
  //   displaySubgrpState = false;
  //   currSubgrpIDPopup = ID;
  // }

  // let groupNames = document.getElementById(`group-${ID}`);
  // const key = `groupAss-${ID}`;
  // if (openedId !== ID) {
  //   let openedGroup = document.getElementById(`details-${openedId}`);
  //   displayAssessState = false;

  const details = await fetchGroup(ID);
  console.log("details", details);


  //   const assess = await fetchGroup(ID, "assessments");

  //   removeMarker(assessGroup[key]);

  //   assessGroup[key] = assess.assessments;
  //   addMarker(assessGroup[key], "yellow");

  //   let coords = [];
  //   assessGroup[key].forEach((ass) => {
  //     coords.push(ass.start_coor);
  //   });

  //   if (openedGroup) {
  //     openedGroup.remove();
  //     removeMarker(assessGroup[`groupAss-${openedId}`]);
  //     addMarker(assessGroup[`groupAss-${openedId}`]);
  //   }
  //   openedId = ID;

  closeGroupDetails(openedId);
  main.insertAdjacentHTML(
    "afterend",
    `
    <aside class="groupDetails details" id="groupDetails-${ID}">
      <div
        id="details__toggle"
        class="details__toggle z-[-1] sm:hidden text-center flex items-center justify-center text-5xl leading-none rounded-full h-14 w-16 pb-2 pl-5 bg-light absolute top-[50%] translate-y-[-50%] right-0 translate-x-[65%] duration-300 ease-in-out"
      >
        &lsaquo;
      </div>
      <div>
        <div
          class="top flex z-50 w-full items-center top-0 left-0 allindent bg-dark text-light"
        >
          <h2 class="text-light">Location</h2>
        </div>
      </div>
      <div
        class="yellow-part bg-primary flex justify-between items-center border-y-[1px]"
        id="toggle-2"
      >
        <span class="pin_loc flex gap-1 items-center cursor-pointer">
          <img src="/img/pin-loc.png" alt="" class="w-[15px] h-[15px] md:w-[20px] md:h-[20px] lg:w-[30px] lg:h-[30px]"/>
          <p>${details.name}</p>
        </span>
        <a class="text-2xl sm:text-2xl md:text-3xl lg:text-4xl" onclick="closeGroupDetails(${ID}, ${true})">×</a>
      </div>
      <div class="detailedInfo h-full overflow-y-auto" id="details-2">
        <span class="detailed-info border-t-2 flex justify-between">
            <p class="font-bold  ">Summary Information</p>
            <button id="downloadSummaryBtn" onclick="downloadSummary(${ID})"><img src="/img/download.png" class="w-[15px] h-[15px] md:w-[20px] md:h-[20px] lg:w-[25px] lg:h-[25px]" alt="" /></button>
        </span>
        <div class="detailedInfos__wrapper">
          <div class="detailed-info">
            <span class="flex gap-[15px] items-center">
              <img src="/img/length.png" class="" alt="" />
              <p class="font-bold">Length of Road Monitored:</p>
            </span>
            <p class="detailed_assess">${details.n_assess * 5} meters</p>
          </div>
          <div class="detailed-info">
            <span class="flex gap-[15px] items-center">
              <img src="/img/lanes.png" alt="" />
              <p class="font-bold">Number of Assessments:</p>
            </span>
            <p class="detailed_assess">${details.n_assess} assessments</p>
          </div>
          <div class="detailed-info">
            <span class="flex gap-[15px] items-center">
              <img src="/img/cracks-detected.png" alt="" />
              <p class="font-bold">Types of Cracks Detected:</p>
            </span>
            <span class="grid gap-2">
              <p class="detailed_assess">Transverse Cracks (${
                details.n_cracks.trans
              })</p>
              <p class="detailed_assess">Longitudinal Cracks (${
                details.n_cracks.longi
              })</p>
              <p class="detailed_assess">Multiple Cracks (${
                details.n_cracks.multi
              })</p>
            </span>
          </div>
          <div class="detailed-info">
            <span class="flex gap-[15px] items-center">
              <img src="/img/total-crack.png" alt="" />
              <p class="font-bold">Total Number of Cracks:</p>
            </span>
            <p class="detailed_assess">${
              details.n_cracks.trans +
              details.n_cracks.longi +
              details.n_cracks.multi
            } cracks</p>
          </div>
          <div class="detailed-info">
            <span class="flex gap-[15px] items-center">
              <img src="/img/date.png" alt="" />
              <p class="font-bold">Date Last Updated:</p>
            </span>
            <p class="detailed_assess">${details.date}</p>
          </div>
        </div>
      </div>
    </aside>
  `
  );
  sideGIS.classList.add("open");


  document.getElementById("details__toggle").addEventListener("click", () => {
    document.querySelector(".details").classList.toggle("close");
    document.querySelector(".details__toggle").classList.toggle("scale-x-[-1]");
    document.querySelector(".details__toggle").classList.toggle("pl-5");
    document.querySelector(".details__toggle").classList.toggle("pr-5");
  });

  const toggleButton = document.getElementById("details__toggle");
  const detailsPanel = document.querySelector(".details");

  // Function to reset classes when screen reaches 'sm'
  function resetOnSm(event) {
    if (event.matches) {
      detailsPanel.classList.remove("close");
      toggleButton.classList.remove("scale-x-[-1]", "pl-5", "pr-5");
      toggleButton.classList.add("pl-5");
    }
  }
  // Media query for 'sm' breakpoint (640px)
  const smMediaQuery = window.matchMedia("(min-width: 640px)");
  // Run on page load and when media query changes
  resetOnSm(smMediaQuery);
  smMediaQuery.addEventListener("change", resetOnSm);

  if (ID !== openedId) changePanel(ID, details.parent_id);
  console.log("parent_id", details.parent_id);
  openedId = ID;

  //   let expanded = document.getElementById(`toggle-${ID}`);
  //   let sumDetails = document.getElementById(`details-${ID}`);

  //   expanded.addEventListener("click", () => {
  //     sumDetails.classList.toggle("open");
  //   });

  //   zoomToPoints(coords);
  //   sumDetails.classList.add("open");
  // } else {
  //   let track = document.getElementById(`details-${ID}`);

  //   if (!track.classList.contains("open")) {
  //     let coords = [];
  //     assessGroup[key].forEach((ass) => {
  //       coords.push(ass.start_coor);
  //     });
  //     zoomToPoints(coords);
  //     removeMarker(assessGroup[key]);
  //     addMarker(assessGroup[key], "yellow");
  //   } else {
  //     const allCoords = Object.values(assessGroup).flatMap((group) =>
  //       group.map((item) => item.start_coor)
  //     );
  //     zoomToPoints(allCoords);
  //     removeMarker(assessGroup[key]);
  //     addMarker(assessGroup[key]);
  //   }
  // }
};

const downloadSummary = async (ID) => {
  const summary = await fetchGroup(ID, "summary");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tableColumn = [
    "Assessment Number",
    "Coordinates",
    "Crack Number",
    "Crack Information",
  ];
  const tableRows = [];

  summary.assessments.forEach((assessment, index) => {
    const [startLat, startLng] = Array.isArray(assessment.start_coor)
      ? assessment.start_coor
      : assessment.start_coor.split(",").map(Number);
    const [endLat, endLng] = Array.isArray(assessment.end_coor)
      ? assessment.end_coor
      : assessment.end_coor.split(",").map(Number);
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    const midCoordinates = `${midLat.toFixed(6)}, ${midLng.toFixed(6)}`;

    // For each assessment, we set the initial row with the assessment number and coordinates
    assessment.cracks.forEach((crack, crackIndex) => {
      const assessmentRow = [
        crackIndex === 0 ? `Assessment #${index + 1}` : "", // Only show assessment number for the first crack
        crackIndex === 0 ? midCoordinates : "", // Only show coordinates for the first crack
        `Crack #${crackIndex + 1}`,
        `Type: ${capitalizeFirstLetter(
          crack.crack_type
        )}\nSeverity: ${capitalizeFirstLetter(crack.crack_severity)}\nLength: ${
          crack.crack_length
        }m\nWidth: ${
          crack.crack_width == null ? "0.5" : `${crack.crack_width}`
        }m`,
      ];
      tableRows.push(assessmentRow);
    });
  });

  doc.setFontSize(18);
  doc.text(
    `Detailed Report - ${summary.address}`,
    105,
    20,
    null,
    null,
    "center"
  );

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: "grid",
    headStyles: {
      fillColor: [210, 183, 70],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 12,
      textColor: [0, 0, 0],
      cellPadding: 5,
    },
  });

  // 3-column image layout after table
  let startY = doc.lastAutoTable.finalY + 10;
  let x = 10;
  let y = startY;
  let column = 0;
  const imageWidth = 50;
  const imageHeight = 95;
  const padding = 10;

  for (let i = 0; i < summary.assessments.length; i++) {
    const assessment = summary.assessments[i];
    const imageUrl = `${url}/image/${assessment.filename}.jpg`;
    const label = `Assessment #${i + 1}`;

    try {
      const imgData = await getImageBase64(imageUrl);

      // Check if there's enough space for the image
      const remainingSpace = doc.internal.pageSize.height - y - 10; // 10px padding

      // If there's not enough space left, add a new page
      if (remainingSpace < imageHeight + 16) {
        doc.addPage();
        x = 10;
        y = 10;
        column = 0;
      }

      // Draw image
      doc.addImage(imgData, "JPEG", x, y, imageWidth, imageHeight);

      // Draw label below image
      doc.setFontSize(8);
      doc.text(label, x, y + imageHeight + 4);

      column++;
      x += imageWidth + padding;

      // If 3 images per row, move to next row
      if (column === 3) {
        column = 0;
        x = 10;
        y += imageHeight + 16 + padding;
      }
    } catch (err) {
      doc.setFontSize(10);
      doc.text("Image failed to load", x, y);
      column++;
      x += imageWidth + padding;

      if (column === 3) {
        column = 0;
        x = 10;
        y += imageHeight + 16 + padding;
      }

      if (y > 250) {
        doc.addPage();
        x = 10;
        y = 10;
        column = 0;
      }
    }
  }

  doc.save(`Summary-${summary.address}-${ID}.pdf`);
};

// Helper to fetch image and convert to Base64
const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = function () {
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

// Utility to capitalize first letter
const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);


const resetMarkerColors = () => {
  const marks = Object.values(markers); // Assuming 'markers' is an object of marker instances
  marks.forEach((mark) => {
    mark.setIcon(blueMark); // Use the built-in Leaflet default icon
  });
};

const changePanel = async (ID, parentID) => {
  let subgrp = await fetchGroup(ID, "children");
  let assess = await fetchGroup(ID, "assessments");

  document.querySelector(".groupsPanel").remove();

  let backFunc = `displayGroupDetails(${parentID})`;
  console.log("parent", parentID);
  if (!parentID) backFunc = `closeGroupDetails(${openedId}, ${true})`;
  main.insertAdjacentHTML(
    "afterend",
    `
    <aside class="groupsPanel">
      <div class="groupsPanel__menu" id="groupsPanel__menu">
        <span class=""></span>
        <span class=""></span>
        <span class=""></span>
      </div>
      <div class="groupsPanel__back"><span onclick="${backFunc}">&larr;</span></div>
      <div
        class="backdrop absolute w-full h-full top-0 left-0 z-40 sm:hidden"
      ></div>
      <div class="groupsPanel__wrapper h-full grid grid-rows-[auto_1fr]">
        <div class="groupsLabel z-50 w-full">
          <div
            class="groupsPanel--subs grid grid-cols-2 justify-items-center"
          >
            <h6 id="assessments" class="open">Assessments</h6>
            <h6 id="subgroups">Subgroups</h6>
          </div>
        </div>

        <div class="groupsList">
          <div class="groupsList--content open" id="assessments-content">

          </div>

          <div class="groupsList--content" id="subgroups-content">

          </div>
        </div>
      </div>
    </aside>
    `
  );

  document.getElementById("groupsPanel__menu").addEventListener("click", () => {
    document.querySelector(".groupsPanel").classList.toggle("open");
    document.querySelector(".groupsPanel__wrapper").classList.toggle("open");
    document.querySelector(".groupsPanel__back").classList.toggle("open");
    document.querySelector(".backdrop").classList.toggle("z-40");
  });

  document.addEventListener("touchstart", (event) => {
    const menuButton = document.getElementById("groupsPanel__menu");
    const panel = document.querySelector(".groupsPanel");
    const wrapper = document.querySelector(".groupsPanel__wrapper");
    const back = document.querySelector(".groupsPanel__back");
    const backdrop = document.querySelector(".backdrop");

    // Check if the click is outside the panel and menu button
    if (
      !panel.contains(event.target) &&
      !menuButton.contains(event.target) &&
      window.innerWidth < 640 // Apply only for mobile screens (sm)
    ) {
      panel.classList.remove("open");
      wrapper.classList.remove("open");
      back.classList.remove("open");
      backdrop.classList.add("z-40");
    }
  });

  const assessContent = document.getElementById("assessments-content");
  assess = assess.assessments;
  let index = 0;
  let focus = [];
  resetMarkerColors();
  assessContent.innerHTML = "";
  assess.forEach((ass) => {
    index++;
    let lat = (ass.start_coor[0] + ass.end_coor[0]) / 2;
    let lng = (ass.start_coor[1] + ass.end_coor[1]) / 2;
    assessContent.innerHTML += `
        <h6 id="assess-${ass.id}" class="assess" onclick="displayMarkersDetails(${ass.id}, ${lat}, ${lng});">Assessment ${index}</h6>
      `;
    mark = markers[`assID-${ass.id}`];
    focus.push(mark);
    mark.setIcon(yellowMark);
  });
  zoomToPoints(focus);

  const subgrpContent = document.getElementById("subgroups-content");
  subgrp = subgrp.children;
  subgrpContent.innerHTML = "";
  subgrp.forEach((sub) => {
    subgrpContent.innerHTML += `
        <h6 id="group-${sub.id}" onclick="displayGroupDetails(${sub.id})">${sub.name}</h6>
      `;
  });

  document.querySelectorAll(".groupsPanel--subs h6").forEach((sub) => {
    sub.addEventListener("click", () => {
      document.querySelectorAll(".groupsPanel--subs h6").forEach((subI) => {
        subI.classList.remove("open");
      });
      sub.classList.add("open");
      document.querySelectorAll(".groupsList--content").forEach((content) => {
        content.classList.remove("open");
      });
      document.getElementById(`${sub.id}-content`).classList.add("open");
    });
  });
  sideGIS.classList.add("open");

  

};

const closeMarkerDetails = async (ID = null) => {
  document.querySelectorAll(".groupsList--content h6").forEach((assess) => {
    assess.classList.remove("selected");
  });
  openedMarkId = 0;
  if (openedId !== 0) displayGroupDetails(openedId);
  else {
    let target = document.querySelector(".details");
    target.classList.add("animate-moveOutLeft", "z-40");
    setTimeout(() => {
      target.remove();
    }, 300);
  };
  sideGIS.classList.remove("open");
  markers[`assID-${ID}`].closePopup();
};

const closeGroupDetails = async (ID, animate = false) => {
  openedMarkId = 0;
  let target = document.querySelector(".details");
  if (!target) return;

  if (animate) {
    openedId = 0;
    target.classList.add("animate-moveOutLeft", "z-40");
    homePanel();
    displayGroupLevels();
    document.getElementById("sortGroup").value = selectedGroup;
    setTimeout(() => {
      target.remove();
    }, 300);
  } else target.remove();

};

map.on("click", () => {
  if (openedMarkId) {
    closeMarkerDetails();
    sideGIS.classList.remove("open");
  }
});

init();


/----------------------------------------/;
const closeSubgrpDetails = async (ID, parentID, all = false) => {
  closeAssessmentDetails();
  removeMarker(assessGroup[`groupAss-${ID}`]);
  const subgrpPopup = document.getElementById("subgroupPopup");
  if (subgrpPopup) subgrpPopup.remove();

  if (currSubgrpIDPopup != parentID && !all) {
    displaySubgrpState = true;
    displayAssessState = true;
    currSubgrpIDPopup = parentID;

    if (currSubgrpIDPopup != openedId) goForward(parentID);
    else {
      // currSubgrpParentIDPopup = 0;
      let expanded = document.getElementById(`toggle-${openedId}`);
      let sumDetails = document.getElementById(`details-${openedId}`);
      expanded.addEventListener("click", () => {
        sumDetails.classList.toggle("open");
      });

      removeMarker(assessGroup[`groupAss-${openedId}`]);
      addMarker(assessGroup[`groupAss-${openedId}`], "yellow");
    }
  } else {
    addMarker(assessGroup[`groupAss-${ID}`]);
    currSubgrpIDPopup = 0;
    currSubgrpParentIDPopup = 0;
  }
  delete assessGroup[`groupAss-${ID}`];
};

const addMarker = async (coords, color = "", popup = false) => {
  const infoPanel = document.querySelector("#crack-details");
  let markers = [];
  let assessIndex = 0;
  coords.forEach((coor) => {
    assessIndex++;
    const coors = coor.start_coor;
    let marker;
    if (color) marker = L.marker(coors, { icon: yellowIcon }).addTo(map);
    // Opens popup by default;
    else marker = L.marker(coors).addTo(map); // Opens popup by default;

    // Bind popup once, but don't open it yet
    marker.bindPopup(`Assessment ${assessIndex}`, { closeButton: false });

    // Click event for opening the popup and showing crack details
    marker.on("click", async () => {
      if (currentPopup) {
        map.closePopup(currentPopup); // Close previous popup
      }

      marker.openPopup(); // Open new popup
      currentPopup = marker.getPopup(); // Store the opened popup

      if (openedMark != coor.id) {
        openedMark = coor.id;

        // Fetch and display crack details
        let lat = coors[0] < 0 ? "S" : "N";
        let lon = coors[1] < 0 ? "E" : "W";

        document.getElementById(
          "coordinates"
        ).innerHTML = `${coors[0]} ${lat}, ${coors[1]} ${lon}`;

        // let grpNameElement = document.getElementById(`grpname-${groupID}`);
        // let grpName = grpNameElement
        //   ? grpNameElement.innerHTML
        //   : "Unknown Group";
        // document.getElementById("group").innerHTML = grpName;

        const ancestors = await fetchGroup(coor.id, "ancestors");
        console.log(ancestors);
        document.getElementById("address").innerHTML = "";
        let i = ancestors.length;
        ancestors.forEach((ancestor) => {
          i--;
          console.log("jkahskjahs", i);
          let comma = ", ";
          if (i + 1 == ancestors.length) {
            comma = "";
          }
          console.log("yow", i + 1 !== ancestors.length);
          let func = `goBack(${ancestor.id}, ${i})`;
          if (popup && ancestors.length - i != ancestors.length) {
            func = `closeSubgrpDetails(${ancestors[i - 1].id}, ${
              ancestors[i].id
            })`;
          }
          if (i + 1 == ancestors.length) func = `goBack(${ancestor.id}, ${i})`;
          document.getElementById("address").innerHTML += `
            <a onclick="${func}" class=""><p>${comma}${ancestor.name}</p></a>
          `;
        });

        let crackDetails = await fetchCracks(coor.id);
        let index = 0;
        infoPanel.innerHTML = ""; // Clear existing content

        crackDetails.cracks.forEach((crack) => {
          index++;

          let sol =
            crack.crack_type === "longitudinal" ||
            crack.crack_type === "transverse"
              ? "Asphalt"
              : "Reblock";

          infoPanel.innerHTML += `
          <div class="crack-info grid gap-2">
            <h3 class="font-bold">Crack ${index}:</h3>
            <p><span class="font-bold">Type: </span>${crack.crack_type}</p>
            <p><span class="font-bold">Severity: </span>${crack.crack_severity}</p>
            <p><span class="font-bold">Recommended Solution: </span>${sol}</p>
          </div>
        `;
        });

        infoPanel.innerHTML += `
            <img src="crack.png" class="object-fit p-5">
        `;

        document.getElementById("AssessCloseBtn").innerHTML = `
          <a onclick="closeAssessmentDetails()">&times;</a>
        `;

        document.getElementById("crack").classList.remove("-translate-x-full");
        document.getElementById("crack").style.left = "0";
      }
    });

    // Ensure only the first marker in the **entire session** opens its popup
    if (!firstPopupOpened) {
      marker.openPopup();
      currentPopup = marker.getPopup();
      firstPopupOpened = true;
    }

    markers.push(marker);
  });
  if (color) markerArr = markers;
};

const removeMarker = (coords) => {
  coords.forEach((coor) => {
    const [lat, lng] = coor.start_coor; // Extract lat & lng from array

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        let markerLatLng = layer.getLatLng();
        if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
          map.removeLayer(layer);
        }
      }
    });
  });
};

// function zoomToPoints(coords) {
//   const bounds = L.latLngBounds(coords);
//   map.fitBounds(bounds, { padding: [50, 50] });
// }

function zoomToPoints(markers) {
  const group = new L.featureGroup(markers);
  map.fitBounds(group.getBounds(), {
    padding: [350, 50], // adds 100px padding on all sides, feels like zooming out
  });
}

const goBack = (ID, index) => {
  closeAssessmentDetails();

  let option;
  if (index == 0) option = "region";
  else if (index == 1) option = "province";
  else if (index == 2) option = "city";

  if (document.getElementById("subgroupPopup") && currSubgrpIDPopup != ID) {
    closeSubgrpDetails(
      currSubgrpIDPopup,
      currSubgrpParentIDPopup,
      (all = true)
    );
  }

  if (currSubgrpIDPopup == ID) return;

  document.getElementById("sortGroup").value = option;
  groupSorting(ID, option);
};

const closeAssessmentDetails = () => {
  document.getElementById("crack").style.left = "-100%";
  openedMark = 0;
  map.closePopup();
};

async function generateSummary(ID) {
  let data = await fetchGroup(ID, "summary");
  console.log(data);
  const container = document.createElement("div");
  container.classList.add("container");
  container.id = "report-container";

  container.innerHTML = `
            <h2 class="title">Road Assessment Report</h2>
            <div class="info" id="info-container"></div>
            <h3 class="title">Assessments</h3>
            <div id="assessments-container"></div>
        `;

  document.body.appendChild(container);
  populateInfo(data);
  generateAssessments(data);
}

async function populateInfo(data) {
  const infoContainer = document.getElementById("info-container");
  infoContainer.innerHTML = `
            <p><strong>Address:</strong> ${data.address}</p>
            <p><strong>Total Assessments:</strong> ${data.totalAssessments}</p>
            <p><strong>Crack Types:</strong> ${data.crackTypes}</p>
            <p><strong>Latest Update:</strong> ${data.latestUpdate}</p>
        `;
}

async function generateAssessments(data) {
  const container = document.getElementById("assessments-container");
  container.innerHTML = "";
  console.log(data.assessments);
  data.assessments.forEach((assessment) => {
    const assessmentDiv = document.createElement("div");
    assessmentDiv.classList.add("assessment-container");

    const table = document.createElement("table");
    table.classList.add("assessment-table");
    table.innerHTML = `
                <tr><th colspan="2">Assessment ID: ${assessment.id}</th></tr>
                <tr><td><strong>Date</strong></td><td>${
                  assessment.date
                }</td></tr>
                <tr><td><strong>Start Coordinates</strong></td><td>${assessment.start_coor.join(
                  ", "
                )}</td></tr>
                <tr><td><strong>End Coordinates</strong></td><td>${assessment.end_coor.join(
                  ", "
                )}</td></tr>
                <tr><th colspan="2">Crack Details</th></tr>
                ${assessment.cracks
                  .map(
                    (crack) =>
                      `<tr><td>${crack.crack_type}</td><td>${crack.crack_severity}</td></tr>`
                  )
                  .join("")}
            `;

    const imageDiv = document.createElement("div");
    imageDiv.classList.add("image-container");

    const img = document.createElement("img");
    img.classList.add("assessment-image");
    // img.src = `images/assessment_${assessment.id}.png`;
    img.src = `crack.png`;
    img.alt = `Assessment ${assessment.id}`;

    imageDiv.appendChild(img);
    assessmentDiv.appendChild(table);
    assessmentDiv.appendChild(imageDiv);
    container.appendChild(assessmentDiv);
  });
}

// Add markers to the map

// displayGroupLevel(selectedGroup);

